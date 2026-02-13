import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
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

    const { paymentId } = params;

    // Buscar el pago
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        order: {
          userId: user.id,
        },
      },
      include: {
        order: {
          include: {
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
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    // Formatear los datos para el frontend
    const paymentData = {
      id: payment.id,
      transactionId: payment.transactionId,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
      order: {
        id: payment.order.id,
        orderNumber: payment.order.orderNumber,
        totalAmount: payment.order.totalAmount,
        status: payment.order.status,
        paymentStatus: payment.order.paymentStatus,
        items: payment.order.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          product: item.product,
        })),
      },
      shippingAddress: {
        name: `${payment.order.user.firstName} ${payment.order.user.lastName || ""}`,
        address: (payment.order.shippingAddress as any)?.address || "",
        city: (payment.order.shippingAddress as any)?.city || "",
        phone: (payment.order.shippingAddress as any)?.phone || "",
      },
    };

    return NextResponse.json(paymentData);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del pago" },
      { status: 500 }
    );
  }
}
