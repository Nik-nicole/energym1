import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Bold redirige aquí con query params: transaction_id, status, reference
export default async function BoldConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{
    planOrderId?: string;
    transaction_id?: string;
    status?: string;
    bold_reference?: string;
    reference?: string;
  }>;
}) {
  const { planOrderId, transaction_id, status, bold_reference, reference } = await searchParams;

  if (!planOrderId) {
    redirect("/perfil");
  }

  // Bold envía status: APPROVED, REJECTED, PENDING
  const pagoExitoso = status === "APPROVED";

  if (pagoExitoso && transaction_id) {
    try {
      // Buscar la orden
      const planOrder = await prisma.planOrder.findUnique({
        where: { id: planOrderId },
        include: { plan: true, user: true },
      });

      if (planOrder && planOrder.status === "PENDING") {
        // Crear el payment
        const payment = await prisma.payment.create({
          data: {
            sedeId: planOrder.sedeId,
            amount: planOrder.totalPrice,
            paymentMethod: "BOLD",
            status: "PAID",
            transactionId: transaction_id,
            gatewayResponse: {
              bold_status: status,
              bold_reference: bold_reference || reference,
              planOrderId: planOrderId,
            },
          },
        });

        // Actualizar la orden a CONFIRMED
        await prisma.planOrder.update({
          where: { id: planOrderId },
          data: {
            status: "CONFIRMED",
            paymentId: payment.id,
          },
        });

        // Activar el plan para el usuario
        const startDate = new Date();
        const endDate = new Date();

        const duracion = planOrder.plan.duracion.toLowerCase();
        if (duracion.includes("mes")) {
          const meses = parseInt(duracion) || 1;
          endDate.setMonth(endDate.getMonth() + meses);
        } else if (duracion.includes("año") || duracion.includes("year")) {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          // Default 1 mes
          endDate.setMonth(endDate.getMonth() + 1);
        }

        await prisma.userPlan.upsert({
          where: {
            userId_planId: {
              userId: planOrder.userId,
              planId: planOrder.planId,
            },
          },
          update: {
            isActive: true,
            startDate,
            endDate,
            paymentId: payment.id,
          },
          create: {
            userId: planOrder.userId,
            planId: planOrder.planId,
            startDate,
            endDate,
            isActive: true,
            paymentId: payment.id,
          },
        });
      }
    } catch (error) {
      console.error("Error procesando callback Bold:", error);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#050505]">
      <Header />
      <div className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {pagoExitoso ? (
            <>
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✅</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                ¡Pago Exitoso!
              </h1>
              <p className="text-gray-400 mb-2">
                Tu plan ha sido activado exitosamente.
              </p>
              {transaction_id && (
                <p className="text-gray-500 text-sm mb-8">
                  Referencia: {transaction_id}
                </p>
              )}
              <Link
                href="/perfil"
                className="inline-flex items-center gap-2 px-8 py-4 gradient-bg rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Ver mi perfil
              </Link>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">❌</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Pago no completado
              </h1>
              <p className="text-gray-400 mb-8">
                {status === "REJECTED"
                  ? "El pago fue rechazado. Por favor intenta con otro método."
                  : "Hubo un problema con tu pago. Por favor intenta nuevamente."}
              </p>
              <Link
                href="/planes"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 rounded-xl font-semibold text-white hover:bg-white/20 transition-colors"
              >
                Ver planes disponibles
              </Link>
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
