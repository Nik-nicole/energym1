import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;

    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Obtener la orden del producto
    const productOrder = await prisma.productOrder.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        product: true,
        sede: true
      },
    });

    if (!productOrder) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: productOrder.id,
        orderNumber: `ORD-${productOrder.id}`,
        totalAmount: productOrder.totalPrice,
        status: productOrder.status,
        paymentStatus: 'PENDING',
        items: [{
          id: productOrder.product.id,
          quantity: productOrder.quantity,
          unitPrice: productOrder.unitPrice,
          totalPrice: productOrder.totalPrice,
          product: {
            id: productOrder.product.id,
            nombre: productOrder.product.nombre,
            imagen: productOrder.product.imagen
          }
        }],
        createdAt: productOrder.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Error al obtener la orden" },
      { status: 500 }
    );
  }
}
