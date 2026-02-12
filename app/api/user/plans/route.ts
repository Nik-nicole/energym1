export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET - Obtener planes del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Buscar órdenes confirmadas del usuario
    const orders = await prisma.order.findMany({
      where: { 
        userId: session.user.id,
        status: "CONFIRMED",
        paymentStatus: "PAID"
      },
      include: {
        items: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformar los datos al formato esperado
    const plans: any[] = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.plan) {
          plans.push({
            id: order.id,
            userId: order.userId,
            planId: item.plan.id,
            status: 'ACTIVE',
            startDate: order.createdAt,
            endDate: null,
            paymentMethod: order.paymentMethod || 'CREDIT_CARD',
            createdAt: order.createdAt,
            plan: item.plan
          });
        }
      });
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching user plans:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
