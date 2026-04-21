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

    // Bold rechaza localhost en algunos escenarios; usar origen público
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://energym1-five.vercel.app';
    const publicOrigin = baseUrl.includes('localhost') ? 'https://energym1-five.vercel.app' : baseUrl;

    // El precio de producto ya incluye IVA
    const totalAmount = Math.round(totalPrice); // Total final (IVA incluido)
    const ivaRate = 0.19;
    const subtotal = Math.round(totalAmount / (1 + ivaRate)); // Base sin IVA
    const ivaAmount = totalAmount - subtotal;

    // Crear pago y orden primero para poder usar orderId en callback_url/redirection_url
    const { payment, productOrder } = await prisma.$transaction(async (tx) => {
      const paymentRecord = await tx.payment.create({
        data: {
          sedeId: sede.id,
          amount: totalAmount,
          paymentMethod: paymentInfo.method || 'BOLD',
          status: 'PENDING',
          transactionId: reference,
          gatewayResponse: {},
        },
      });

      const orderRecord = await tx.productOrder.create({
        data: {
          userId: user.id,
          productId: product.id,
          sedeId: sede.id,
          paymentId: paymentRecord.id,
          quantity,
          unitPrice,
          totalPrice: totalAmount,
          status: 'PENDING',
          // Guardar información de envío
          shippingAddress: shippingAddress.direccion,
          shippingCity: shippingAddress.ciudad,
          shippingState: shippingAddress.departamento,
          shippingPhone: shippingAddress.telefono,
          shippingNotes: shippingAddress.indicaciones,
          postalCode: shippingAddress.codigoPostal,
        },
      });

      return { payment: paymentRecord, productOrder: orderRecord };
    });

    const callbackUrl = `${publicOrigin}/payment-status?orderId=${productOrder.id}`;

    // Crear link de pago con BOLD
    const boldResponse = await BoldService.createPaymentLink({
      amount: totalAmount,
      currency: 'COP',
      reference,
      description: `${product.nombre} (x${quantity}) - Energym`,
      callbackUrl,
      apiKey: boldApiKey,
      imageUrl: product.imagen ? product.imagen.split(',')[0].trim() : `${publicOrigin}/logo.png`,
      taxes: [
        {
          type: 'VAT',
          base: subtotal,
          value: ivaAmount,
        },
      ],
    });

    if (!boldResponse.success) {
      // Rollback manual si falla la creación del link
      await prisma.productOrder.delete({ where: { id: productOrder.id } });
      await prisma.payment.delete({ where: { id: payment.id } });

      return NextResponse.json({
        error: "Error en el procesamiento del pago",
        details: boldResponse.message
      }, { status: 400 });
    }

    const paymentLinkId =
      (boldResponse as any)?.data?.payload?.payment_link ||
      (boldResponse as any)?.data?.payment_link ||
      reference;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: paymentLinkId,
        gatewayResponse: JSON.parse(JSON.stringify((boldResponse as any)?.data ?? boldResponse)),
      },
    });

    const productOrderWithRelations = await prisma.productOrder.findUnique({
      where: { id: productOrder.id },
      include: {
        product: true,
        sede: true,
        payment: true,
      },
    });

    // Enviar email de confirmación (simulado)
    console.log(`Email de confirmación enviado a ${user.email} para la orden ${productOrder.id} - Payment URL: ${boldResponse.paymentUrl}`);

    return NextResponse.json({
      success: true,
      order: productOrderWithRelations,
      payment: boldResponse,
      paymentUrl: boldResponse.paymentUrl,
      transactionId: paymentLinkId,
      productOrderId: productOrder.id,
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
