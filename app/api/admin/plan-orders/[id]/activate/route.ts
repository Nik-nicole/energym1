import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

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

  // Para planes por sesión, horas, etc., no hay fecha de fin basada en tiempo.
  if (normalizedDuration.includes('sesion') || normalizedDuration.includes('hora')) {
    return null;
  }

  // Fallback para duraciones desconocidas, no se establece fecha de fin.
  return null;
}

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
        OR: [
          { endDate: null },
          { endDate: { gt: new Date() } }
        ]
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
    const endDate = calculateEndDate(startDate, planOrder.plan.duracion);

    // Crear el UserPlan activo
    const userPlan = await prisma.userPlan.create({
      data: {
        userId: planOrder.userId,
        planId: planOrder.planId,
        startDate,
        endDate,
        isActive: true,
        status: 'ACTIVE',
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
