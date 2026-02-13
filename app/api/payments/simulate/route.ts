import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, amount, paymentMethod } = body;

    if (!orderId || !amount) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Obtener la orden
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Verificar que el monto coincida
    if (order.totalAmount !== amount) {
      return NextResponse.json({ error: "El monto no coincide con la orden" }, { status: 400 });
    }

    // Simular procesamiento de pago (siempre exitoso en esta simulación)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Actualizar el estado de la orden
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
    });

    // Crear registro de pago simulado
    const payment = await prisma.payment.create({
      data: {
        orderId: orderId,
        amount: amount,
        paymentMethod: paymentMethod || "WOMPI",
        status: "COMPLETED",
        transactionId: `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        gatewayResponse: {
          simulated: true,
          timestamp: new Date().toISOString(),
          paymentMethod,
        },
      },
    });

    console.log("Payment simulated:", payment);

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
      },
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Error simulating payment:", error);
    return NextResponse.json(
      { error: "Error al procesar el pago" },
      { status: 500 }
    );
  }
}
