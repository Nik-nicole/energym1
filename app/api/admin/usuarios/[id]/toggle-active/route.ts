import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function calculateEndDate(startDate: Date, duration: string): Date | null {
  const normalizedDuration = duration.toLowerCase();
  const amount = parseInt(normalizedDuration) || 1;
  const newEndDate = new Date(startDate);

  if (normalizedDuration.includes('día') || normalizedDuration.includes('dia')) {
    newEndDate.setDate(newEndDate.getDate() + amount);
    return newEndDate;
  }
  if (normalizedDuration.includes('mes')) {
    newEndDate.setMonth(newEndDate.getMonth() + amount);
    return newEndDate;
  }
  if (normalizedDuration.includes('año') || normalizedDuration.includes('year')) {
    newEndDate.setFullYear(newEndDate.getFullYear() + amount);
    return newEndDate;
  }

  if (normalizedDuration.includes('sesion') || normalizedDuration.includes('hora')) {
    return null;
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { isActive } = body;

    console.log("Toggle active request:", { userId: params.id, isActive });

    // Primero verificar el estado actual del usuario
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { isActive: true }
    });

    console.log("Current user state:", currentUser);

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        isActive,
      },
    });

    console.log("Updated user from DB:", { id: user.id, isActive: user.isActive });

    // Verificar que el cambio se guardó correctamente
    const verification = await prisma.user.findUnique({
      where: { id: params.id },
      select: { isActive: true }
    });

    console.log("Verification after update:", verification);

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener el usuario actualizado con toda la información necesaria
    const updatedUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
        planOrders: {
          include: {
            plan: true,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1, // Solo la orden más reciente por usuario
        },
        _count: {
          select: {
            planOrders: true,
            productOrders: true,
          },
        },
      },
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener el plan activo considerando tanto PlanOrder como UserPlan
    const latestPlanOrder = updatedUser.planOrders[0];
    const activePlan = latestPlanOrder?.plan;
    
    let planStatus = null;
    if (latestPlanOrder && activePlan) {
      // Buscar el UserPlan correspondiente para obtener la fecha real de fin
      const userPlan = await prisma.userPlan.findFirst({
        where: {
          userId: updatedUser.id,
          planId: activePlan.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Determinar si el plan está realmente activo (no expirado)
      const calculatedEndDate = activePlan?.duracion 
        ? calculateEndDate(new Date(latestPlanOrder.createdAt), activePlan.duracion)
        : new Date(latestPlanOrder.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      let endDate = userPlan?.endDate 
        ? new Date(userPlan.endDate).toISOString().split('T')[0] 
        : (calculatedEndDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]);
      
      const isExpired = userPlan?.endDate ? new Date(userPlan.endDate) <= new Date() : false;
      const isVerified = latestPlanOrder.status === "VERIFIED";
      const isUserPlanActive = userPlan?.isActive && userPlan?.status === 'ACTIVE';

      planStatus = {
        id: activePlan.id,
        nombre: activePlan.nombre,
        fechaInicio: latestPlanOrder.createdAt.toISOString().split('T')[0],
        fechaFin: endDate,
        isActive: isVerified && isUserPlanActive && !isExpired,
        isDeactivated: !isVerified || !isUserPlanActive || isExpired,
      };
    }

    // Transform response for frontend compatibility
    const transformedUser = {
      ...updatedUser,
      planActivo: planStatus,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };

    console.log("Final transformed user:", { 
      id: transformedUser.id, 
      isActive: transformedUser.isActive,
      planActivo: transformedUser.planActivo 
    });

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error("Error toggling user active status:", error);
    return NextResponse.json(
      { error: "Error al cambiar estado del usuario" },
      { status: 500 }
    );
  }
}
