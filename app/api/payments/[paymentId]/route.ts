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

    // Buscar el pago con sus órdenes relacionadas
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        OR: [
          { planOrders: { some: { userId: user.id } } },
          { productOrders: { some: { userId: user.id } } },
        ],
      },
      include: {
        planOrders: {
          include: {
            plan: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        productOrders: {
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
        sede: {
          select: {
            nombre: true,
            direccion: true,
            ciudad: true,
            telefono: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    // Formatear los datos para el frontend
    const primaryOrder = payment.productOrders[0] || payment.planOrders[0];
    
    const paymentData = {
      id: payment.id,
      transactionId: payment.transactionId,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
      productOrders: payment.productOrders.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        product: item.product,
      })),
      planOrders: payment.planOrders.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        plan: item.plan,
      })),
      shippingAddress: {
        name: user.firstName + " " + (user.lastName || ""),
        address: primaryOrder?.shippingAddress || "",
        city: primaryOrder?.shippingCity || "",
        phone: primaryOrder?.shippingPhone || "",
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
