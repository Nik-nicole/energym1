import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Obtener la orden del plan para verificar su estado
    const planOrder = await prisma.planOrder.findUnique({
      where: { id },
      include: {
        user: true,
        plan: true,
      },
    });

    if (!planOrder) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el plan esté en estado VERIFIED
    if (planOrder.status !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'El plan no ha sido verificado. No se puede activar.' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya tiene un plan activo
    const existingUserPlan = await prisma.userPlan.findFirst({
      where: {
        userId: planOrder.userId,
        isActive: true,
      },
    });

    if (existingUserPlan) {
      return NextResponse.json(
        { error: 'El usuario ya tiene un plan activo' },
        { status: 400 }
      );
    }

    // Calcular la fecha de finalización del plan
    const startDate = new Date();
    const endDate = new Date();
    
    // Añadir duración del plan (asumimos que la duración viene en formato legible)
    // Por ejemplo: "1 mes", "3 meses", "1 año"
    const duration = planOrder.plan.duracion.toLowerCase();
    if (duration.includes('mes')) {
      const months = parseInt(duration) || 1;
      endDate.setMonth(endDate.getMonth() + months);
    } else if (duration.includes('año') || duration.includes('year')) {
      const years = parseInt(duration) || 1;
      endDate.setFullYear(endDate.getFullYear() + years);
    } else if (duration.includes('día') || duration.includes('dia')) {
      const days = parseInt(duration) || 1;
      endDate.setDate(endDate.getDate() + days);
    } else {
      // Por defecto, 1 mes si no se puede interpretar
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Crear el UserPlan activo
    const userPlan = await prisma.userPlan.create({
      data: {
        userId: planOrder.userId,
        planId: planOrder.planId,
        startDate,
        endDate,
        isActive: true,
      },
    });

    // Opcional: Actualizar el estado de la orden a ACTIVATED o similar
    await prisma.planOrder.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Plan activado correctamente',
      userPlan,
    });
  } catch (error) {
    console.error('Error activating plan:', error);
    return NextResponse.json(
      { error: 'Error al activar el plan' },
      { status: 500 }
    );
  }
}
