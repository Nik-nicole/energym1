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

    // Buscar la orden
    const order = await prisma.order.findUnique({
      where: { id: paymentId },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la orden pertenece al usuario
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Simular procesamiento de pago (en producción, aquí iría la integración con pasarela de pago)
    // Por ahora, asumimos que el pago siempre es exitoso para demostración
    const paymentSuccessful = true;

    if (paymentSuccessful) {
      // Actualizar el estado de la orden
      const updatedOrder = await prisma.order.update({
        where: { id: paymentId },
        data: {
          status: "CONFIRMED",
          paymentStatus: "PAID",
        },
      });

      // Aquí podrías enviar email de confirmación, notificaciones, etc.

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: "Pago procesado exitosamente",
      });
    } else {
      // Si el pago falla
      await prisma.order.update({
        where: { id: paymentId },
        data: {
          status: "CANCELLED",
          paymentStatus: "FAILED",
        },
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
