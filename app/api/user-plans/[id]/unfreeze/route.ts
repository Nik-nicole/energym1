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
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;
    const userId = session.user.id;

    // Intentar obtener el UserPlan por ID primero
    let userPlan = await prisma.userPlan.findUnique({
      where: { id },
      include: {
        plan: true,
        user: true,
      },
    });

    // Si no se encuentra por ID, buscar por userId y planId
    if (!userPlan) {
      console.log('No se encontró UserPlan por ID, buscando por userId y planId...');
      userPlan = await prisma.userPlan.findFirst({
        where: {
          userId: userId,
          planId: id,
          isActive: false,
        },
        include: {
          plan: true,
          user: true,
        },
      });
    }

    // Si aún no se encuentra y es admin, buscar solo por planId
    if (!userPlan && session.user.role === 'ADMIN') {
      console.log('Buscando UserPlan como admin por planId...');
      userPlan = await prisma.userPlan.findFirst({
        where: {
          planId: id,
          isActive: false,
        },
        include: {
          plan: true,
          user: true,
        },
      });
    }

    if (!userPlan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    // Validar que el plan pertenezca al usuario O que sea un administrador
    if (userPlan.userId !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar este plan' },
        { status: 403 }
      );
    }

    // Validar que el plan esté inactivo o congelado
    if (userPlan.isActive) {
      return NextResponse.json(
        { error: 'Solo se pueden descongelar planes inactivos o congelados' },
        { status: 400 }
      );
    }

    // Calcular días congelados y nueva fecha de fin
    const now = new Date();
    let frozenDays = 0;
    let newEndDate = userPlan.endDate ? new Date(userPlan.endDate) : null;

    if (userPlan.freezeDate) {
      const freezeDate = new Date(userPlan.freezeDate);
      frozenDays = Math.floor((now.getTime() - freezeDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Si no hay endDate, calcular según duración del plan
      if (!newEndDate) {
        newEndDate = new Date(now);
        const duration = userPlan.plan.duracion.toLowerCase();
        if (duration.includes('mes')) {
          const months = parseInt(duration) || 1;
          newEndDate.setMonth(newEndDate.getMonth() + months);
        } else if (duration.includes('año')) {
          const years = parseInt(duration) || 1;
          newEndDate.setFullYear(newEndDate.getFullYear() + years);
        } else {
          newEndDate.setMonth(newEndDate.getMonth() + 1);
        }
      }
      
      // Extender endDate por los días congelados
      newEndDate.setDate(newEndDate.getDate() + frozenDays);
    }

    // Descongelar el plan
    let unfrozenPlan;
    try {
      unfrozenPlan = await prisma.userPlan.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          isActive: true,
          freezeDate: null,
          endDate: newEndDate,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      // Si los campos no existen, usar la lógica temporal
      console.log('Los campos status/freezeDate no existen, usando lógica temporal');
      unfrozenPlan = await prisma.userPlan.update({
        where: { id },
        data: {
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      message: 'Plan descongelado correctamente',
      userPlan: unfrozenPlan,
      frozenDays,
    });
  } catch (error) {
    console.error('Error unfreezing plan:', error);
    return NextResponse.json(
      { error: 'Error al descongelar el plan' },
      { status: 500 }
    );
  }
}