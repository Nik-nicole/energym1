import prisma from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { ConfirmacionPagoClient } from "./_components/confirmacion-pago-client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getData(paymentId: string) {
  console.log("Buscando orden con ID:", paymentId);
  try {
    const order = await prisma.order.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        totalAmount: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        shippingAddress: true,
        notes: true,
        planId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            productId: true,
            planId: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            product: true,
          },
        },
      },
    });

    console.log("Orden encontrada:", order ? "SÍ" : "NO");

    if (!order) {
      return null;
    }

    // Obtener información del plan desde el orderItem o desde la relación directa
    const orderItem = order.items[0];
    let planInfo = null;

    if (orderItem?.planId) {
      // Buscar el plan por planId si existe en el orderItem
      planInfo = await prisma.plan.findUnique({
        where: { id: orderItem.planId },
      });
    } else if (order.planId) {
      // Buscar el plan por planId si existe en la orden
      planInfo = await prisma.plan.findUnique({
        where: { id: order.planId },
      });
    } else if (orderItem?.productId) {
      // Fallback: buscar el plan por productId si existe
      planInfo = await prisma.plan.findUnique({
        where: { id: orderItem.productId },
      });
    }

    // Convertir orden a formato de payment para compatibilidad
    const payment: {
      id: string;
      userId: string;
      planId: string;
      amount: number;
      paymentMethod: string;
      status: string;
      paymentStatus: string;
      cardName: string | null;
      email: string;
      transactionId: string;
      createdAt: Date;
      user: {
        id: string;
        firstName: string;
        lastName: string | null;
        email: string;
      };
      plan: {
        id: string;
        nombre: string;
        precio: number;
        descripcion: string;
        duracion: string;
        esVip: boolean;
      };
    } = {
      id: order.id,
      userId: order.userId,
      planId: order.planId || orderItem?.planId || orderItem?.productId || "",
      amount: order.totalAmount,
      paymentMethod: order.paymentMethod || "",
      status: order.status,
      paymentStatus: order.paymentStatus,
      cardName: null,
      email: order.user.email,
      transactionId: order.orderNumber,
      createdAt: order.createdAt,
      user: order.user,
      plan: planInfo ? {
        id: planInfo.id,
        nombre: planInfo.nombre,
        precio: planInfo.precio,
        descripcion: planInfo.descripcion,
        duracion: planInfo.duracion,
        esVip: planInfo.esVip,
      } : {
        id: orderItem?.productId || "",
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
