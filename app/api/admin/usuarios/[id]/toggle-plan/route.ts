import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { planId, isActive } = await request.json();

    if (!planId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    // Buscar al usuario y su orden más reciente
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          include: {
            items: {
              include: {
                plan: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const latestOrder = user.orders[0];
    if (!latestOrder) {
      return NextResponse.json(
        { error: "El usuario no tiene órdenes" },
        { status: 400 }
      );
    }

    // Actualizar el estado de la orden (solo el plan, no el usuario)
    const updatedOrder = await prisma.order.update({
      where: { id: latestOrder.id },
      data: {
        status: isActive ? "CONFIRMED" : "CANCELLED",
        paymentStatus: isActive ? "PAID" : "CANCELLED",
      },
      include: {
        items: {
          include: {
            plan: true,
          },
        },
        user: true,
      },
    });

    // NO desactivar al usuario - solo el plan
    const updatedUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          include: {
            items: {
              include: {
                plan: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
        },
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Transformar los datos para incluir el plan activo/desactivado
    const planItem = updatedOrder.items.find(item => item.plan);
    const planStatus = planItem?.plan ? {
      id: planItem.plan.id,
      nombre: planItem.plan.nombre,
      fechaInicio: updatedOrder.createdAt.toISOString().split('T')[0],
      fechaFin: new Date(updatedOrder.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: isActive,
      isDeactivated: !isActive,
    } : null;

    const finalUser = {
      ...updatedUser,
      planActivo: planStatus,
    };

    return NextResponse.json(finalUser);

  } catch (error) {
    console.error("Error toggling plan:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
