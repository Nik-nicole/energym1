import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function PATCH(
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

    const { status } = await request.json();
    const { id } = params;

    if (!status) {
      return NextResponse.json(
        { error: 'El estado es requerido' },
        { status: 400 }
      );
    }

    // Validar que el estado sea válido
    const validStatuses = ['PENDING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Estado no válido' },
        { status: 400 }
      );
    }

    // Actualizar el estado de la orden
    const updatedOrder = await prisma.productOrder.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
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
        product: {
          select: {
            id: true,
            nombre: true,
            precio: true,
            categoria: true,
            imagen: true,
          },
        },
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating product order:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la orden' },
      { status: 500 }
    );
  }
}
