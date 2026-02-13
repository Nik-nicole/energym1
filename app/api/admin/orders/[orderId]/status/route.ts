import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

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
    const validStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }

    // Obtener la orden actual
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Validar flujo de estados
    const statusFlow: Record<string, string[]> = {
      "PENDING": ["CONFIRMED", "CANCELLED"],
      "CONFIRMED": ["SHIPPED", "CANCELLED"],
      "SHIPPED": ["DELIVERED"],
      "DELIVERED": [], // Estado final
      "CANCELLED": [], // Estado final
    };

    const currentStatus = existingOrder.status as keyof typeof statusFlow;
    if (!statusFlow[currentStatus].includes(status)) {
      return NextResponse.json({ 
        error: `No se puede cambiar de "${existingOrder.status}" a "${status}"` 
      }, { status: 400 });
    }

    // Actualizar la orden
    const updatedOrder = await prisma.order.update({
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
        items: {
          include: {
            product: {
              select: {
                id: true,
                nombre: true,
                imagen: true,
              },
            },
          },
        },
      },
    });

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
