import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { WompiService } from "@/lib/wompi";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      productId,
      sedeId,
      quantity,
      unitPrice,
      totalPrice,
      shippingAddress,
      paymentInfo
    } = body;

    // Validar datos
    if (!productId || !sedeId || !quantity || !unitPrice || !totalPrice || !shippingAddress || !paymentInfo) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Verificar que el producto exista y esté disponible
    const product = await prisma.producto.findUnique({
      where: { id: productId }
    });

    if (!product || !product.activo) {
      return NextResponse.json({ error: "Producto no disponible" }, { status: 404 });
    }

    // Verificar stock
    if (product.stock < quantity) {
      return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
    }

    // Verificar que la sede exista
    const sede = await prisma.sede.findUnique({
      where: { id: sedeId },
      include: {
        paymentGateway: true
      }
    });

    if (!sede || !sede.activo) {
      return NextResponse.json({ error: "Sede no disponible" }, { status: 404 });
    }

    // Generar reference para Wompi
    const reference = WompiService.generateReference();

    // Procesar pago con Wompi
    const wompiResponse = await WompiService.processPayment({
      amount: totalPrice,
      currency: 'COP',
      customerEmail: paymentInfo.email || user.email,
      paymentMethod: paymentInfo.method,
      ...(paymentInfo.method === 'card' && {
        cardInfo: {
          number: paymentInfo.cardNumber || '4242424242424242', // Tarjeta de prueba
          name: paymentInfo.cardName || 'Test User',
          expiry: paymentInfo.cardExpiry || '12/25',
          cvc: paymentInfo.cardCvc || '123'
        }
      }),
      ...(paymentInfo.method === 'pse' && {
        pseInfo: {
          documentType: paymentInfo.documentType,
          documentNumber: paymentInfo.documentNumber
        }
      }),
      reference
    });

    if (!wompiResponse.success) {
      return NextResponse.json({ 
        error: "Error en el procesamiento del pago", 
        details: wompiResponse.message 
      }, { status: 400 });
    }

    // Crear el registro de pago
    const payment = await prisma.payment.create({
      data: {
        sedeId: sede.id,
        amount: totalPrice,
        paymentMethod: paymentInfo.method,
        status: 'COMPLETED',
        transactionId: wompiResponse.transactionId,
        gatewayResponse: JSON.parse(JSON.stringify(wompiResponse))
      }
    });

    // Crear la orden del producto
    const productOrder = await prisma.productOrder.create({
      data: {
        userId: user.id,
        productId: product.id,
        sedeId: sede.id,
        paymentId: payment.id,
        quantity,
        unitPrice,
        totalPrice,
        status: 'PAID', // Solo crear la orden si el pago fue exitoso
        // Guardar información de envío
        shippingAddress: shippingAddress.direccion,
        shippingCity: shippingAddress.ciudad,
        shippingState: shippingAddress.departamento,
        shippingPhone: shippingAddress.telefono,
        shippingNotes: shippingAddress.indicaciones,
        postalCode: shippingAddress.codigoPostal
      },
      include: {
        product: true,
        sede: true,
        payment: true
      }
    });

    // Actualizar el stock del producto
    await prisma.producto.update({
      where: { id: productId },
      data: {
        stock: {
          decrement: quantity
        }
      }
    });

    // Enviar email de confirmación (simulado)
    console.log(`Email de confirmación enviado a ${user.email} para la orden ${productOrder.id}`);

    return NextResponse.json({
      success: true,
      order: productOrder,
      payment: wompiResponse,
      message: "Orden creada exitosamente"
    });

  } catch (error) {
    console.error("Error creating product order:", error);
    return NextResponse.json(
      { error: "Error al crear la orden" },
      { status: 500 }
    );
  }
}
