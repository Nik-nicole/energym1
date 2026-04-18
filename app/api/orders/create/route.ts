import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// Rate limiting simple en memoria
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return true;
  }

  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Rate limiting por usuario
    if (!checkRateLimit(session.user.email)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta en un minuto." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { items, totalAmount, shippingData, paymentMethod } = body;

    // Obtener el usuario con su sede y paymentGateway
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        sede: {
          include: {
            paymentGateway: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Validar que haya items
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No hay productos en la orden" }, { status: 400 });
    }

    // Procesar TODOS los items del carrito
    const products: any[] = [];
    let totalSubtotal = 0;
    let totalQuantity = 0;

    for (const item of items) {
      const product = await prisma.producto.findUnique({
        where: { id: item.productId },
        include: { sede: true }
      });

      if (!product || !product.activo) {
        return NextResponse.json({ error: `Producto ${item.productId} no disponible` }, { status: 404 });
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}, Solicitado: ${item.quantity}` 
        }, { status: 400 });
      }

      products.push({
        ...product,
        requestedQuantity: item.quantity,
        unitPrice: item.unitPrice
      });

      totalSubtotal += item.unitPrice * item.quantity;
      totalQuantity += item.quantity;
    }

    // Usar la sede del primer producto (o la del usuario si no tiene producto)
    const firstProduct = products[0];
    let sedeId = user.sedeId;

    if (!sedeId && firstProduct.sedeId) {
      sedeId = firstProduct.sedeId;
    }

    if (!sedeId) {
      return NextResponse.json({
        error: "No se puede determinar la sede para esta orden"
      }, { status: 400 });
    }

    // Obtener la sede con su payment gateway
    const sede = await prisma.sede.findUnique({
      where: { id: sedeId },
      include: { paymentGateway: true }
    });

    if (!sede?.paymentGateway) {
      return NextResponse.json({
        error: "La sede no tiene una pasarela de pago configurada"
      }, { status: 400 });
    }

    // La cuentaBanco contiene el NOMBRE de la variable de entorno
    const envVarName = sede.paymentGateway.cuentaBanco;
    const boldApiKey = envVarName ? process.env[envVarName] : null;

    if (!boldApiKey || boldApiKey.length < 10) {
      console.error("[Orders Create] API Key no encontrada para variable:", envVarName);
      return NextResponse.json({
        error: "Configuración de pago incompleta - API Key no configurada"
      }, { status: 500 });
    }

    // Generar número de orden único
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calcular totales de todos los productos
    const ivaRate = 0.19;
    const totalWithIva = Math.round(totalSubtotal * (1 + ivaRate));
    const ivaAmount = Math.round(totalSubtotal * ivaRate);

    // Generar referencia única para Bold
    const reference = `ORD-${user.id.slice(0, 8)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .substring(0, 60);

    // Crear el registro de pago con estado PENDING
    const payment = await prisma.payment.create({
      data: {
        sedeId: sedeId,
        amount: totalWithIva,
        paymentMethod: paymentMethod || 'BOLD',
        status: 'PENDING',
        transactionId: reference,
        gatewayResponse: {} // Se llenará después de la respuesta de Bold
      }
    });

    // Crear la orden del producto con items en una transacción
    const productOrder = await prisma.$transaction(async (tx) => {
      // Crear la orden principal
      const order = await tx.productOrder.create({
        data: {
          userId: user.id,
          productId: firstProduct.id,
          paymentId: payment.id, // Asociar con el pago
          sedeId: sedeId,
          quantity: totalQuantity,
          unitPrice: totalSubtotal / totalQuantity,
          totalPrice: totalWithIva,
          status: 'PENDING',
          customerName: shippingData?.name || '',
          shippingAddress: shippingData?.address || '',
          shippingCity: shippingData?.city || '',
          shippingPhone: shippingData?.phone || '',
          shippingNotes: shippingData?.notes || ''
        }
      });

      // Crear los items individuales
      for (const product of products) {
        await tx.productOrderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity: product.requestedQuantity,
            unitPrice: product.unitPrice,
            totalPrice: product.unitPrice * product.requestedQuantity
          }
        });
      }

      return order;
    });

    // Generar link de pago con Bold
    const boldApiUrl = "https://integrations.api.bold.co/online/link/v1";
    
    // Bold rechaza "localhost" con 403 Forbidden. Usamos la URL de producción obligatoriamente.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://energym1-five.vercel.app";
    const publicOrigin = baseUrl.includes("localhost") ? "https://energym1-five.vercel.app" : baseUrl;
    
    const returnUrl = `${publicOrigin}/payment/return?link_id={bold-order-id}`;

    // Generar descripción con todos los productos
    const productDescriptions = products.map(p => `${p.nombre} (x${p.requestedQuantity})`).join(', ');
    const description = products.length > 1 
      ? `${products.length} productos: ${productDescriptions.substring(0, 80)}... - Energym`
      : `${firstProduct.nombre} (x${firstProduct.requestedQuantity}) - Energym`;

    // Usar imagen del primer producto
    const imageUrl = firstProduct.imagen ? firstProduct.imagen.split(',')[0].trim() : `${publicOrigin}/logo.png`;
    
    const boldPayload = {
      amount_type: "CLOSE",
      amount: {
        currency: "COP",
        total_amount: totalWithIva,
        taxes: [
          {
            type: "VAT",
            base: totalSubtotal,
            value: ivaAmount,
          },
        ],
      },
      reference: reference,
      description: description,
      callback_url: returnUrl,
      redirection_url: returnUrl,
      image_url: imageUrl,
    };

    console.log("REDIRECTION URL:", returnUrl);
    console.log("[Orders Create] Llamando a Bold API...");
    console.log("[Orders Create] Payload:", JSON.stringify(boldPayload, null, 2));

    const boldResponse = await fetch(boldApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `x-api-key ${boldApiKey}`,
      },
      body: JSON.stringify(boldPayload),
    });

    const boldData = await boldResponse.json();
    console.log("[Orders Create] Respuesta Bold:", boldResponse.status, JSON.stringify(boldData, null, 2));

    if (!boldResponse.ok) {
      console.error("[Orders Create] Error de Bold:", boldResponse.status, JSON.stringify(boldData));
      // Si falla Bold, eliminar la orden y el pago creados
      await prisma.productOrder.delete({ where: { id: productOrder.id } });
      await prisma.payment.delete({ where: { id: payment.id } });
      return NextResponse.json(
        { error: "Error al generar el link de pago", details: JSON.stringify(boldData) },
        { status: 500 }
      );
    }

    const paymentUrl = boldData.payload?.url || boldData.url || boldData.payment_link;
    const paymentLinkId = boldData.payload?.payment_link || boldData.payment_link;

    if (!paymentUrl) {
      console.error("[Orders Create] No se recibió URL de pago:", JSON.stringify(boldData));
      await prisma.productOrder.delete({ where: { id: productOrder.id } });
      await prisma.payment.delete({ where: { id: payment.id } });
      return NextResponse.json(
        { error: "Error: No se recibió URL de pago de Bold" },
        { status: 500 }
      );
    }

    // Actualizar el payment con la respuesta de Bold y el paymentLinkId
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayResponse: boldData,
        // Guardar el paymentLinkId para consultas futuras
        // Usamos el campo transactionId para guardar el paymentLinkId de Bold
        transactionId: paymentLinkId
      }
    });

    const duration = Date.now() - startTime;
    console.log(`[Orders Create] Orden creada y link generado en ${duration}ms`);

    // Guardar info de todos los productos para el cliente
    const orderDetails = {
      productOrderId: productOrder.id,
      products: products.map(p => ({
        id: p.id,
        quantity: p.requestedQuantity,
        unitPrice: p.unitPrice
      }))
    };

    return NextResponse.json({
      success: true,
      paymentUrl,
      productOrderId: productOrder.id,
      orderDetails, // Enviar detalles de todos los productos al cliente
      order: {
        id: productOrder.id,
        orderNumber: orderNumber,
        totalAmount: productOrder.totalPrice,
        status: productOrder.status,
        paymentStatus: 'PENDING',
        items: products.map(p => ({
          id: p.id,
          quantity: p.requestedQuantity,
          unitPrice: p.unitPrice,
          totalPrice: p.unitPrice * p.requestedQuantity,
          product: {
            id: p.id,
            nombre: p.nombre,
            imagen: p.imagen
          }
        })),
        shippingAddress: shippingData
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Orders Create] Error (${duration}ms):`, error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear la orden", details: errorMessage },
      { status: 500 }
    );
  }
}
