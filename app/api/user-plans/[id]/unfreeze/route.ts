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

    // Obtener el UserPlan para verificar
    const userPlan = await prisma.userPlan.findUnique({
      where: { id },
      include: {
        plan: true,
        user: true,
      },
    });

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

    // Descongelar el plan - intentar usar campos status/freezeDate si existen
    let unfrozenPlan;
    try {
      unfrozenPlan = await prisma.userPlan.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          isActive: true,
          freezeDate: null,
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
    });
  } catch (error) {
    console.error('Error unfreezing plan:', error);
    return NextResponse.json(
      { error: 'Error al descongelar el plan' },
      { status: 500 }
    );
  }
}