import { prisma } from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { ConfirmacionPagoClient } from "./_components/confirmacion-pago-client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getData(paymentId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    // Convertir orden a formato de payment para compatibilidad
    const payment = {
      id: order.id,
      userId: order.userId,
      planId: order.items[0]?.productId || "",
      amount: order.totalAmount,
      paymentMethod: order.paymentMethod || "",
      status: order.status,
      paymentStatus: order.paymentStatus,
      cardName: null,
      email: order.user.email,
      transactionId: order.orderNumber,
      createdAt: order.createdAt,
      user: order.user,
      plan: {
        id: order.items[0]?.productId || "",
        nombre: "Plan Adquirido",
        precio: order.totalAmount,
        descripcion: "Descripción del plan",
        duracion: "1 mes",
        esVip: false,
      },
    };

    return { payment };
  } catch (error) {
    console.error("Error fetching payment data:", error);
    return null;
  }
}

export default async function ConfirmacionPagoPage({
  params,
}: {
  params: { paymentId: string };
}) {
  const data = await getData(params.paymentId);

  if (!data) {
    notFound();
  }

  const { payment } = data;

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <ConfirmacionPagoClient payment={payment} />
      <Footer />
    </main>
  );
}
