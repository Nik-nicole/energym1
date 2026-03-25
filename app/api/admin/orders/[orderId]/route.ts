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

    // Try to find the order in both PlanOrder and ProductOrder tables
    const [existingPlanOrder, existingProductOrder] = await Promise.all([
      prisma.planOrder.findUnique({
        where: { id: orderId },
      }),
      prisma.productOrder.findUnique({
        where: { id: orderId },
      })
    ]);

    const existingOrder = existingPlanOrder || existingProductOrder;

    if (!existingOrder) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Delete the order from the appropriate table
    if (existingPlanOrder) {
      await prisma.planOrder.delete({
        where: { id: orderId },
      });
    } else {
      await prisma.productOrder.delete({
        where: { id: orderId },
      });
    }

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
