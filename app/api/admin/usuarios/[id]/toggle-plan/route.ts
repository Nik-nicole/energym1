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

    // Buscar al usuario y sus órdenes de planes
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        planOrders: {
          include: {
            plan: true,
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

    const latestPlanOrder = user.planOrders[0];
    if (!latestPlanOrder) {
      return NextResponse.json(
        { error: "El usuario no tiene órdenes de planes" },
        { status: 400 }
      );
    }

    // Actualizar el estado del plan en UserPlan o crearlo si no existe
    const userPlan = await prisma.userPlan.upsert({
      where: {
        userId_planId: {
          userId: params.id,
          planId: planId,
        },
      },
      update: {
        isActive: isActive,
      },
      create: {
        userId: params.id,
        planId: planId,
        isActive: isActive,
      },
    });

    // Actualizar el estado de la orden de plan
    const updatedOrder = await prisma.planOrder.update({
      where: { id: latestPlanOrder.id },
      data: {
        status: isActive ? "VERIFIED" : "CANCELLED",
      },
      include: {
        plan: true,
        user: true,
      },
    });

    // Obtener el usuario actualizado
    const updatedUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        planOrders: {
          include: {
            plan: true,
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
    const planStatus = updatedOrder.plan ? {
      id: updatedOrder.plan.id,
      nombre: updatedOrder.plan.nombre,
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
