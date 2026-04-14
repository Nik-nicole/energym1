import { redirect } from "next/navigation";
import prisma from "@/lib/db";

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
        include: { plan: true, user: true, payment: true },
      });

      if (planOrder && planOrder.status === "PENDING") {
        // Si ya tiene un payment asociado, actualizarlo
        if (planOrder.payment) {
          await prisma.payment.update({
            where: { id: planOrder.payment.id },
            data: {
              status: "PAID",
              transactionId: transaction_id,
              gatewayResponse: {
                bold_status: status,
                bold_reference: bold_reference || reference,
                planOrderId: planOrderId,
              },
            },
          });
        } else {
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

          // Actualizar la orden con el paymentId
          await prisma.planOrder.update({
            where: { id: planOrderId },
            data: {
              status: "PAID",
              paymentId: payment.id,
            },
          });
        }

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
            paymentId: planOrder.paymentId,
          },
          create: {
            userId: planOrder.userId,
            planId: planOrder.planId,
            startDate,
            endDate,
            isActive: true,
            paymentId: planOrder.paymentId,
          },
        });
      }
    } catch (error) {
      console.error("Error procesando callback Bold:", error);
    }
  }

  // Redirigir a la nueva página de estado de pago con el transaction_id de Bold
  if (transaction_id) {
    redirect(`/payment-status?transactionId=${transaction_id}`);
  } else {
    // Si no hay transaction_id, redirigir al perfil
    redirect("/perfil");
  }
}
