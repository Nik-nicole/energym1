import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json(
        { error: 'El ID del plan es requerido' },
        { status: 400 }
      );
    }

    // Obtener las órdenes de planes del usuario para el plan específico
    const planOrders = await prisma.planOrder.findMany({
      where: {
        userId: id,
        planId: planId,
      },
      include: {
        plan: {
          select: {
            id: true,
            nombre: true,
            precio: true,
            duracion: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
    });

    return NextResponse.json(planOrders);
  } catch (error) {
    console.error('Error fetching user plan orders:', error);
    return NextResponse.json(
      { error: 'Error al obtener las órdenes del plan' },
      { status: 500 }
    );
  }
}
