import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

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

    // Obtener la orden del producto
    const productOrder = await prisma.productOrder.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        product: true,
        sede: true
      }
    });

    if (!productOrder) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Verificar que el monto coincida
    if (productOrder.totalPrice !== amount) {
      return NextResponse.json({ error: "El monto no coincide con la orden" }, { status: 400 });
    }

    // Simular procesamiento de pago (siempre exitoso en esta simulación)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Crear registro de pago simulado
    const payment = await prisma.payment.create({
      data: {
        sedeId: productOrder.sedeId,
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

    // Actualizar el estado de la orden del producto
    const updatedOrder = await prisma.productOrder.update({
      where: { id: orderId },
      data: {
        paymentId: payment.id,
        status: "PAID",
      },
    });

    // Actualizar stock del producto
    await prisma.producto.update({
      where: { id: productOrder.productId },
      data: {
        stock: {
          decrement: productOrder.quantity
        }
      }
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
        status: updatedOrder.status,
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
