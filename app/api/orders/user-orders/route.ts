import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Obtener todas las órdenes de productos del usuario
    const productOrders = await prisma.productOrder.findMany({
      where: { userId: user.id },
      include: {
        product: true,
        sede: true,
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatear las órdenes para la respuesta
    const formattedOrders = productOrders.map(order => ({
      id: order.id,
      date: order.createdAt.toLocaleDateString(),
      total: `$${order.totalPrice.toFixed(2)}`,
      status: order.status === "PAID" ? "Orden Pagada" : 
              order.status === "VERIFIED" ? "Verificada" :
              order.status === "PACKED" ? "Empacada" :
              order.status === "SHIPPED" ? "Enviada" :
              order.status === "CANCELLED" ? "Cancelada" : "Orden Pagada",
      productName: order.product.nombre,
      productImage: order.product.imagen || "/placeholder-product.jpg",
      quantity: order.quantity,
      trackingNumber: "Sin asignar"
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders
    });

  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Error al obtener las órdenes" },
      { status: 500 }
    );
  }
}
