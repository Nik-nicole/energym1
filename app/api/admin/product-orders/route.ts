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

    // Obtener las órdenes de productos
    const productOrders = await prisma.productOrder.findMany({
      select: {
        id: true,
        userId: true,
        productId: true,
        sedeId: true,
        quantity: true,
        unitPrice: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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
            categoria: true,
            precio: true,
            imagen: true,
            descripcion: true,
          },
        },
        sede: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            ciudad: true,
            telefono: true,
            email: true,
            paymentGateway: {
              select: {
                cuentaBanco: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            paymentMethod: true,
            status: true,
            amount: true,
            transactionId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      orders: productOrders
    });
  } catch (error) {
    console.error("Error fetching product orders:", error);
    return NextResponse.json(
      { error: "Error al obtener las órdenes" },
      { status: 500 }
    );
  }
}
