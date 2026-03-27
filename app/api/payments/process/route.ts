export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "ID de pago requerido" },
        { status: 400 }
      );
    }

    // Buscar el pago con sus órdenes relacionadas
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        planOrders: { include: { user: true } },
        productOrders: { include: { user: true } },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el pago pertenece al usuario
    const allOrders = [...payment.planOrders, ...payment.productOrders];
    const userOwnsPayment = allOrders.some(order => order.userId === session.user.id);
    
    if (!userOwnsPayment) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Simular procesamiento de pago (en producción, aquí iría la integración con pasarela de pago)
    // Por ahora, asumimos que el pago siempre es exitoso para demostración
    const paymentSuccessful = true;

    if (paymentSuccessful) {
      // Actualizar el estado del pago
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "PAID",
        },
      });

      // Actualizar el estado de las órdenes relacionadas
      if (payment.planOrders.length > 0) {
        await prisma.planOrder.updateMany({
          where: { paymentId: paymentId },
          data: { status: "CONFIRMED" },
        });
      }
      
      if (payment.productOrders.length > 0) {
        await prisma.productOrder.updateMany({
          where: { paymentId: paymentId },
          data: { status: "CONFIRMED" },
        });
      }

      return NextResponse.json({
        success: true,
        payment: updatedPayment,
        message: "Pago procesado exitosamente",
      });
    } else {
      // Si el pago falla
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "FAILED" },
      });

      await prisma.planOrder.updateMany({
        where: { paymentId: paymentId },
        data: { status: "CANCELLED" },
      });
      
      await prisma.productOrder.updateMany({
        where: { paymentId: paymentId },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json(
        { error: "El pago falló" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
