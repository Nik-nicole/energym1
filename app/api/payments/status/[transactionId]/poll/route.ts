import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BOLD_API_BASE = "https://integrations.api.bold.co/online/link/v1";

/** Estados que Bold retorna cuando el pago ya terminó (sin vuelta atrás) */
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
      `[Poll] transactionStatus sincronizado (${finalStatus}) -> PlanOrder:${planCount} ProductOrder:${productCount}`
    );
  } catch (syncError) {
    // No romper el polling por errores de sincronización secundaria
    console.warn("[Poll] No se pudo sincronizar transactionStatus:", syncError);
  }
}

/**
 * Polling liviano: consulta el estado del link de pago directamente en Bold.
 * - Una sola query a la BD (solo sedeId + paymentGateway para resolver API key).
 * - La llamada real es a Bold API, no a nuestra BD.
 * - Si el estado es terminal, actualiza nuestra BD en el mismo request.
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

    // Una sola query liviana: solo necesitamos el sedeId para resolver la API key
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      select: {
        id: true,
        status: true,
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

    // Si ya tenemos un estado terminal en Payment, asegurar transactionStatus y evitar llamar a Bold
    if (TERMINAL_STATUSES.has(payment.status)) {
      await syncTransactionStatus(payment.id, payment.status);
      return NextResponse.json({ status: payment.status });
    }

    // Resolver la API key desde variables de entorno
    const envVarName = payment.sede?.paymentGateway?.cuentaBanco;
    const boldApiKey = envVarName ? process.env[envVarName] : null;

    if (!boldApiKey) {
      console.error("[Poll] API key de Bold no encontrada para var:", envVarName);
      return NextResponse.json({ error: "Configuración de pago incompleta" }, { status: 500 });
    }

    // Consultar estado directamente en Bold
    const boldResponse = await fetch(`${BOLD_API_BASE}/${transactionId}`, {
      method: "GET",
      headers: {
        "Authorization": `x-api-key ${boldApiKey}`,
        "Content-Type": "application/json",
      },
      // No cachear esta respuesta
      cache: "no-store",
    });

    if (!boldResponse.ok) {
      console.error("[Poll] Bold respondió con error:", boldResponse.status);
      // No es un error nuestro — devolvemos el status actual de la BD para no interrumpir el polling
      return NextResponse.json({ status: payment.status });
    }

    const boldData = await boldResponse.json();
    const boldStatus: string = boldData.status ?? boldData.payload?.status ?? "ACTIVE";

    console.log(`[Poll] Bold status para ${transactionId}:`, boldStatus);

    // Si Bold reporta estado terminal, sincronizar pago + órdenes relacionadas
    if (TERMINAL_STATUSES.has(boldStatus)) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: boldStatus, gatewayResponse: boldData },
      });
      await syncTransactionStatus(payment.id, boldStatus);
      console.log(`[Poll] BD actualizada con estado terminal: ${boldStatus} (transactionStatus sincronizado)`);
    }

    return NextResponse.json({ status: boldStatus });
  } catch (error) {
    console.error("[Poll] Error:", error);
    return NextResponse.json(
      { error: "Error al consultar estado del pago" },
      { status: 500 }
    );
  }
}
