import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function DELETE(
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

    // Obtener la orden para verificar que existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Eliminar la orden (esto eliminará en cascada los items y pagos relacionados)
    await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({
      success: true,
      message: "Orden eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Error al eliminar la orden" },
      { status: 500 }
    );
  }
}
