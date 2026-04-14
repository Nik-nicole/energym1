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

    // Validar que el plan esté activo
    if (!userPlan.isActive) {
      return NextResponse.json(
        { error: 'Solo se pueden congelar planes activos' },
        { status: 400 }
      );
    }

    // Congelar el plan - intentar usar campos status/freezeDate si existen
    let frozenPlan;
    try {
      frozenPlan = await prisma.userPlan.update({
        where: { id },
        data: {
          status: 'FROZEN',
          isActive: false,
          freezeDate: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      // Si los campos no existen, usar la lógica temporal
      console.log('Los campos status/freezeDate no existen, usando lógica temporal');
      frozenPlan = await prisma.userPlan.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      message: 'Plan congelado correctamente',
      userPlan: frozenPlan,
    });
  } catch (error) {
    console.error('Error freezing plan:', error);
    return NextResponse.json(
      { error: 'Error al congelar el plan' },
      { status: 500 }
    );
  }
}
