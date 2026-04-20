import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BOLD_API_BASE = "https://integrations.api.bold.co/online/link/v1";
const TERMINAL_STATUSES = new Set(["PAID", "REJECTED", "CANCELLED", "EXPIRED"]);

async function syncTransactionStatus(paymentId: string, finalStatus: string) {
  try {
    const [planCount, productCount] = await Promise.all([
      prisma.$executeRaw`
        UPDATE "PlanOrder"
        SET "transactionStatus" = ${finalStatus}
        WHERE "paymentId" = ${paymentId}
      `,
      prisma.$executeRaw`
        UPDATE "ProductOrder"
        SET "transactionStatus" = ${finalStatus}
        WHERE "paymentId" = ${paymentId}
      `,
    ]);

    console.log(
      `[Status] transactionStatus sincronizado (${finalStatus}) -> PlanOrder:${planCount} ProductOrder:${productCount}`
    );
  } catch (syncError) {
    // No romper la consulta principal por errores de sincronización secundaria
    console.warn("[Status] No se pudo sincronizar transactionStatus:", syncError);
  }
}

/**
 * Llamada inicial: valida propiedad del pago, obtiene datos del link en Bold,
 * y retorna amount + paymentMethod para que el cliente los cachée.
 * Esta query a la BD solo se hace una vez.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const identifier = params.transactionId;
    if (!identifier) {
      return NextResponse.json({ error: "identificador requerido" }, { status: 400 });
    }

    // Obtener usuario para validar propiedad
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Resolver el pago a partir del orderId (plan o producto) para no exponer LNK_* en la URL
    const [planOrder, productOrder] = await Promise.all([
      prisma.planOrder.findFirst({
        where: { id: identifier, userId: user.id },
        select: {
          id: true,
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              paymentMethod: true,
              transactionId: true,
              sede: {
                select: {
                  paymentGateway: {
                    select: { cuentaBanco: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.productOrder.findFirst({
        where: { id: identifier, userId: user.id },
        select: {
          id: true,
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              paymentMethod: true,
              transactionId: true,
              sede: {
                select: {
                  paymentGateway: {
                    select: { cuentaBanco: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    let payment = planOrder?.payment || productOrder?.payment;
    let resolvedOrderId: string | undefined = planOrder?.id || productOrder?.id;

    // Fallback legacy: permitir identificar por transactionId para compatibilidad con enlaces antiguos
    if (!payment) {
      const legacyPayment = await prisma.payment.findFirst({
        where: {
          transactionId: identifier,
          OR: [
            { planOrders: { some: { userId: user.id } } },
            { productOrders: { some: { userId: user.id } } },
          ],
        },
        select: {
          id: true,
          status: true,
          amount: true,
          paymentMethod: true,
          transactionId: true,
          sede: {
            select: {
              paymentGateway: {
                select: { cuentaBanco: true },
              },
            },
          },
          planOrders: { select: { id: true }, take: 1 },
          productOrders: { select: { id: true }, take: 1 },
        },
      });

      if (!legacyPayment) {
        return NextResponse.json({ error: "Orden o pago no encontrado" }, { status: 404 });
      }

      payment = {
        id: legacyPayment.id,
        status: legacyPayment.status,
        amount: legacyPayment.amount,
        paymentMethod: legacyPayment.paymentMethod,
        transactionId: legacyPayment.transactionId,
        sede: legacyPayment.sede,
      };
      resolvedOrderId = legacyPayment.planOrders[0]?.id || legacyPayment.productOrders[0]?.id;
    }

    // Resolver API key y consultar estado actual en Bold
    const envVarName = payment.sede?.paymentGateway?.cuentaBanco;
    const boldApiKey = envVarName ? process.env[envVarName] : null;

    let currentStatus = payment.status;

    // Si Payment ya está en estado terminal, asegurar transactionStatus y evitar una llamada extra a Bold
    if (TERMINAL_STATUSES.has(payment.status)) {
      await syncTransactionStatus(payment.id, payment.status);

      return NextResponse.json({
        status: currentStatus,
        amount: payment.amount,
        transactionId: payment.transactionId,
        orderId: resolvedOrderId,
        paymentMethod: payment.paymentMethod,
      });
    }

    if (boldApiKey) {
      try {
        const boldResponse = await fetch(`${BOLD_API_BASE}/${payment.transactionId}`, {
          method: "GET",
          headers: {
            "Authorization": `x-api-key ${boldApiKey}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (boldResponse.ok) {
          const boldData = await boldResponse.json();
          const boldStatus: string = boldData.status ?? boldData.payload?.status ?? currentStatus;
          currentStatus = boldStatus;

          // Si Bold ya reporta estado terminal, sincronizar BD (pago + órdenes relacionadas)
          if (TERMINAL_STATUSES.has(boldStatus) && boldStatus !== payment.status) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: boldStatus, gatewayResponse: boldData },
            });
            await syncTransactionStatus(payment.id, boldStatus);
          }
        }
      } catch (boldErr) {
        // Si falla Bold, devolvemos al menos el estado de nuestra BD
        console.warn("[Status] No se pudo consultar Bold, devolviendo estado de BD:", boldErr);
      }
    }

    return NextResponse.json({
      status: currentStatus,
      amount: payment.amount,
      transactionId: payment.transactionId,
      orderId: resolvedOrderId,
      paymentMethod: payment.paymentMethod,
    });
  } catch (error) {
    console.error("[Payments Status] Error:", error);
    return NextResponse.json(
      { error: "Error al consultar el estado del pago" },
      { status: 500 }
    );
  }
}
