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

    const { planId, amount, paymentMethod, cardName } = await request.json();

    if (!planId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // Verificar que el plan existe
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    // Crear orden/pago
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        totalAmount: amount,
        status: "PENDING",
        paymentMethod: paymentMethod,
        paymentStatus: "PENDING",
        orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        planId: planId, // Referencia directa al plan
        items: {
          create: {
            planId: planId, // Usar planId en lugar de productId
            quantity: 1,
            unitPrice: amount,
            totalPrice: amount,
          }
        }
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: order.id,
      order: order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
