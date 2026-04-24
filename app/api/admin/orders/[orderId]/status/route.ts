import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

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
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si el usuario es administrador
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { orderId } = params;
    const body = await request.json();
    const { status } = body;

    // Validar que el estado sea válido
    const validStatuses = ["PENDING", "VERIFIED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }

    // Obtener la orden actual
    const existingOrder = await prisma.planOrder.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Validar flujo de estados para PlanOrder
    const statusFlow: Record<string, string[]> = {
      "PENDING": ["VERIFIED", "CANCELLED"],
      "VERIFIED": ["CANCELLED"],
      "CANCELLED": [], // Estado final
    };

    const currentStatus = existingOrder.status as keyof typeof statusFlow;
    if (!statusFlow[currentStatus].includes(status)) {
      return NextResponse.json({ 
        error: `No se puede cambiar de "${existingOrder.status}" a "${status}"` 
      }, { status: 400 });
    }

    // Actualizar la orden
    const updatedOrder = await prisma.planOrder.update({
      where: { id: orderId },
      data: { 
        status,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        plan: true,
      },
    });

    // Si la orden está siendo verificada (VERIFIED) y tiene un plan, activar el plan para el usuario
    if (status === "VERIFIED" && updatedOrder.plan) {
      try {
        // Calcular la fecha de fin correcta basado en la duracion del plan
        const planEndDate = calculateEndDate(new Date(), updatedOrder.plan.duracion) 
          || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        // Crear registro de plan activo para el usuario
        await prisma.userPlan.upsert({
          where: {
            userId_planId: {
              userId: updatedOrder.user.id,
              planId: updatedOrder.planId!,
            }
          },
          update: {
            isActive: true,
            startDate: new Date(),
            endDate: planEndDate,
            paymentId: updatedOrder.paymentId,
          },
          create: {
            userId: updatedOrder.user.id,
            planId: updatedOrder.planId!,
            isActive: true,
            startDate: new Date(),
            endDate: planEndDate,
            paymentId: updatedOrder.paymentId,
          },
        });

        console.log(`Plan activado para usuario ${updatedOrder.user.email} - Plan: ${updatedOrder.plan.nombre}`);
      } catch (planError) {
        console.error("Error al activar plan:", planError);
        // No fallar la actualización de la orden si hay error con el plan
      }
    }

    // Aquí podrías agregar notificaciones al cliente
    // Por ejemplo: enviar email, notificación push, etc.

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Orden actualizada a "${status}" exitosamente`,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado de la orden" },
      { status: 500 }
    );
  }
}
