import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { BoldService } from "@/lib/bold";

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

    // Verificar que la sede exista y tenga payment gateway
    const sede = await prisma.sede.findUnique({
      where: { id: sedeId },
      include: {
        paymentGateway: true
      }
    });

    if (!sede || !sede.activo || !sede.paymentGateway) {
      return NextResponse.json({ error: "Sede no disponible o sin pasarela de pago configurada" }, { status: 404 });
    }

    // Generar referencia para BOLD
    const reference = BoldService.generateReference('PROD');

    // Obtener API Key de BOLD desde la configuración de la sede
    const envVarName = sede.paymentGateway.cuentaBanco;
    const boldApiKey = envVarName ? process.env[envVarName] : null;
    
    if (!boldApiKey) {
      return NextResponse.json({ 
        error: "Configuración de pago incompleta - API Key de BOLD no configurada" 
      }, { status: 500 });
    }

    // Preparar callback URL
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://energym1-five.vercel.app';
    const callbackUrl = `${origin}/pago/confirmacion/bold-product?productOrderId=${reference}`;

    // Calcular IVA para productos
    const subtotal = totalPrice;
    const ivaRate = 0.19;
    const ivaAmount = Math.round(subtotal * ivaRate);
    const totalAmount = Math.round(subtotal * (1 + ivaRate));

    // Crear link de pago con BOLD
    const boldResponse = await BoldService.createPaymentLink({
      amount: totalAmount,
      currency: 'COP',
      reference,
      description: `${product.nombre} (x${quantity}) - Energym`,
      callbackUrl,
      apiKey: boldApiKey,
      imageUrl: product.imagen ? product.imagen.split(',')[0].trim() : `${origin}/logo.png`,
      taxes: [
        {
          type: 'VAT',
          base: subtotal,
          value: ivaAmount,
        },
      ],
    });

    if (!boldResponse.success) {
      return NextResponse.json({ 
        error: "Error en el procesamiento del pago", 
        details: boldResponse.message 
      }, { status: 400 });
    }

    // Crear el registro de pago con estado PENDING
    const payment = await prisma.payment.create({
      data: {
        sedeId: sede.id,
        amount: totalAmount, // Usar total con IVA
        paymentMethod: paymentInfo.method,
        status: 'PENDING',
        transactionId: boldResponse.reference,
        gatewayResponse: JSON.parse(JSON.stringify(boldResponse))
      }
    });

    // Crear la orden del producto con estado PENDING
    const productOrder = await prisma.productOrder.create({
      data: {
        userId: user.id,
        productId: product.id,
        sedeId: sede.id,
        paymentId: payment.id,
        quantity,
        unitPrice,
        totalPrice: totalAmount, // Guardar total con IVA
        status: 'PENDING',
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

    // Enviar email de confirmación (simulado)
    console.log(`Email de confirmación enviado a ${user.email} para la orden ${productOrder.id} - Payment URL: ${boldResponse.paymentUrl}`);

    return NextResponse.json({
      success: true,
      order: productOrder,
      payment: boldResponse,
      paymentUrl: boldResponse.paymentUrl,
      message: "Orden creada exitosamente. Redirige al usuario a la URL de pago."
    });

  } catch (error) {
    console.error("Error creating product order:", error);
    return NextResponse.json(
      { error: "Error al crear la orden" },
      { status: 500 }
    );
  }
}
