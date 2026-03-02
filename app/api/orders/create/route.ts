import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userQueries, productQueries, sedeQueries } from "@/lib/query-helpers";
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { items, totalAmount, shippingAddress, paymentMethod } = body;

    // Obtener el usuario usando query helper optimizado
    const user = await userQueries.byEmail(session.user.email);

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Validar que haya items
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No hay productos en la orden" }, { status: 400 });
    }

    // Por ahora, procesamos solo el primer item del carrito
    const firstItem = items[0];
    
    // Verificar que el producto exista usando query helper optimizado
    const product = await productQueries.byId(firstItem.productId);

    if (!product || !product.activo) {
      return NextResponse.json({ error: "Producto no disponible" }, { status: 404 });
    }

    // Verificar stock
    if (product.stock < firstItem.quantity) {
      return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
    }

    // Obtener una sede válida usando query helper optimizado
    let sedeId = product.sedeId;
    if (!sedeId) {
      const sedes = await sedeQueries.all();
      if (sedes.length === 0) {
        return NextResponse.json({ error: "No hay sedes disponibles" }, { status: 400 });
      }
      sedeId = sedes[0].id;
    }

    // Generar número de orden único
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Crear la orden del producto (sin procesar pago todavía)
    const productOrder = await prisma.productOrder.create({
      data: {
        userId: user.id,
        productId: product.id,
        sedeId: sedeId,
        quantity: firstItem.quantity,
        unitPrice: firstItem.unitPrice,
        totalPrice: totalAmount,
        status: 'PENDING' // Estado inicial, se actualiza después del pago
      },
      include: {
        product: true,
        sede: true
      }
    });

    return NextResponse.json({
      success: true,
      order: {
        id: productOrder.id,
        orderNumber: orderNumber,
        totalAmount: productOrder.totalPrice,
        status: productOrder.status,
        paymentStatus: 'PENDING',
        items: [{
          id: product.id,
          quantity: firstItem.quantity,
          unitPrice: firstItem.unitPrice,
          totalPrice: totalAmount,
          product: product
        }],
        shippingAddress: shippingAddress
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Error al crear la orden" },
      { status: 500 }
    );
  }
}
