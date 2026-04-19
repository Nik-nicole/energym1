import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BOLD_API_BASE = "https://integrations.api.bold.co/online/link/v1";
const TERMINAL_STATUSES = new Set(["PAID", "REJECTED", "CANCELLED", "EXPIRED"]);

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

    const transactionId = params.transactionId;
    if (!transactionId) {
      return NextResponse.json({ error: "transactionId requerido" }, { status: 400 });
    }

    // Obtener usuario para validar propiedad
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Query completa: valida propiedad + obtiene todos los datos necesarios
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId,
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
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    // Resolver API key y consultar estado actual en Bold
    const envVarName = payment.sede?.paymentGateway?.cuentaBanco;
    const boldApiKey = envVarName ? process.env[envVarName] : null;

    let currentStatus = payment.status;

    if (boldApiKey) {
      try {
        const boldResponse = await fetch(`${BOLD_API_BASE}/${transactionId}`, {
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

          // Si Bold ya reporta estado terminal, sincronizar BD
          if (TERMINAL_STATUSES.has(boldStatus) && boldStatus !== payment.status) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: boldStatus, gatewayResponse: boldData },
            });
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
