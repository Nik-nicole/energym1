export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Rate limiting simple en memoria (para producción usar Redis)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const RATE_LIMIT_MAX = 5; // 5 requests por minuto

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
    console.log("[Bold Product API] Recibiendo solicitud de creación de pago");

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("[Bold Product API] Error: No autorizado - sin sesión");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Rate limiting por usuario
    if (!checkRateLimit(session.user.email)) {
      console.log("[Bold Product API] Rate limit exceeded:", session.user.email);
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta en un minuto." },
        { status: 429 }
      );
    }

    console.log("[Bold Product API] Usuario autenticado:", session.user.email);

    const { productId, quantity = 1 } = await request.json();
    console.log("[Bold Product API] Product ID recibido:", productId, "Cantidad:", quantity);

    if (!productId) {
      console.log("[Bold Product API] Error: productId no proporcionado");
      return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    }

    if (quantity < 1) {
      return NextResponse.json({ error: "La cantidad debe ser al menos 1" }, { status: 400 });
    }

    // 1. Ejecutar queries en paralelo para mejor rendimiento
    const [user, product] = await Promise.all([
      // Obtener usuario con sede y paymentGateway
      prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          sede: {
            include: {
              paymentGateway: true,
            },
          },
        },
      }),
      // Obtener el producto
      prisma.producto.findUnique({
        where: { id: productId, activo: true },
        include: {
          sede: true,
        },
      }),
    ]);

    if (!user) {
      console.log("[Bold Product API] Error: Usuario no encontrado");
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (!product) {
      console.log("[Bold Product API] Error: Producto no encontrado o inactivo:", productId);
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // Verificar stock
    if (product.stock < quantity) {
      console.log("[Bold Product API] Error: Stock insuficiente:", product.stock, "<", quantity);
      return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
    }

    // 2. Verificar que el usuario tenga sede con PaymentGateway
    if (!user.sede?.paymentGateway) {
      console.log("[Bold Product API] Error: Sede sin payment gateway:", user.sedeId);
      return NextResponse.json({
        error: "Tu sede no tiene una pasarela de pago configurada"
      }, { status: 400 });
    }

    // 3. Verificar que el producto pertenezca a la sede del usuario
    if (product.sedeId !== user.sedeId) {
      console.log("[Bold Product API] Error: Producto no disponible en la sede del usuario:", {
        productSedeId: product.sedeId,
        userSedeId: user.sedeId
      });
      return NextResponse.json({
        error: "Este producto no está disponible en tu sede"
      }, { status: 400 });
    }

    // 4. La cuentaBanco contiene el NOMBRE de la variable de entorno (ej: BOLD_API_KEY_SEDE1)
    const envVarName = user.sede.paymentGateway.cuentaBanco;

    // Resolver el valor real desde process.env
    const boldApiKey = envVarName ? process.env[envVarName] : null;

    console.log("[Bold Product API] Env var name:", envVarName);
    console.log("[Bold Product API] Resolved API Key (first 10 chars):", boldApiKey ? boldApiKey.substring(0, 10) + "..." : "NOT FOUND");

    // Validar que existe API Key
    if (!boldApiKey || boldApiKey.length < 10) {
      console.log("[Bold Product API] Error: API Key no encontrada en env para variable:", envVarName);
      return NextResponse.json({
        error: "Configuración de pago incompleta - API Key no configurada"
      }, { status: 500 });
    }

    // 5. Calcular totales y preparar datos para el botón de Bold
    const unitPrice = product.precio;
    const subtotal = unitPrice * quantity;
    const ivaRate = 0.19;
    const totalAmount = Math.round(subtotal * (1 + ivaRate)); // Total en pesos

    // Generar referencia única
    const reference = `PROD-${user.id.slice(0, 8)}-${product.id.slice(0, 8)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .substring(0, 60);

    // 6. Crear registro de Payment y ProductOrder dentro de transacción atómica
    const { productOrder, payment } = await prisma.$transaction(async (tx) => {
      // Verificar que no existe una orden pendiente reciente (evita duplicados)
      const existingOrder = await tx.productOrder.findFirst({
        where: {
          userId: user.id,
          productId: product.id,
          status: "PENDING",
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Últimos 5 minutos
          },
        },
      });

      if (existingOrder) {
        console.log("[Bold Product API] Orden pendiente existente encontrada:", existingOrder.id);
        // Devolver la orden existente y su pago asociado
        const existingPayment = await tx.payment.findUnique({
          where: { id: existingOrder.paymentId! }
        });
        return { productOrder: existingOrder, payment: existingPayment };
      }

      // Crear registro de pago primero
      const paymentRecord = await tx.payment.create({
        data: {
          sedeId: user.sedeId!,
          amount: totalAmount,
          paymentMethod: 'BOLD',
          status: 'PENDING',
          transactionId: reference, // Usar la referencia como transactionId
          gatewayResponse: {}
        }
      });

      // Crear nueva orden asociada al pago
      const order = await tx.productOrder.create({
        data: {
          userId: user.id,
          productId: product.id,
          paymentId: paymentRecord.id, // Asociar con el pago
          sedeId: user.sedeId!,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: subtotal * 1.19,
          status: "PENDING",
        },
      });

      console.log("[Bold Product API] Payment creado:", paymentRecord.id);
      console.log("[Bold Product API] ProductOrder creado:", order.id);
      return { productOrder: order, payment: paymentRecord };
    });

    // 7. Llamar a la API de Bold para generar el link de pago
    const boldApiUrl = "https://integrations.api.bold.co/online/link/v1";
    
    // Bold rechaza "localhost" con 403 Forbidden. Usamos la URL de producción obligatoriamente.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://energym1-five.vercel.app";
    const publicOrigin = baseUrl.includes("localhost") ? "https://energym1-five.vercel.app" : baseUrl;
    
    const callbackUrl = `${publicOrigin}/api/webhooks/bold`;
    const redirectionUrl = `${publicOrigin}/payment/return?link_id={bold-order-id}`;

    // Calcular IVA en pesos
    const ivaAmountPesos = Math.round(subtotal * ivaRate);
    
    const imageUrl = product.imagen ? product.imagen.split(',')[0].trim() : `${publicOrigin}/logo.png`;

    const boldPayload: any = {
      amount_type: "CLOSE",
      amount: {
        currency: "COP",
        total_amount: totalAmount,
        taxes: [
          {
            type: "VAT",
            base: subtotal,
            value: ivaAmountPesos,
          },
        ],
      },
      reference: reference,
      description: `${product.nombre} (x${quantity}) - Energym`,
      callback_url: callbackUrl,
      redirection_url: redirectionUrl,
      image_url: imageUrl,
    };

    console.log("REDIRECTION URL:", redirectionUrl);
    console.log("[Bold Product API] Llamando a Bold API...");
    console.log("[Bold Product API] URL:", boldApiUrl);
    console.log("[Bold Product API] Payload:", JSON.stringify(boldPayload, null, 2));

    const boldResponse = await fetch(boldApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `x-api-key ${boldApiKey}`,
      },
      body: JSON.stringify(boldPayload),
    });

    const boldData = await boldResponse.json();
    console.log("[Bold Product API] Respuesta:", boldResponse.status, JSON.stringify(boldData, null, 2));

    if (!boldResponse.ok) {
      console.error("[Bold Product API] Error de Bold:", boldResponse.status, JSON.stringify(boldData));
      return NextResponse.json(
        { error: "Error al generar el link de pago con Bold", details: JSON.stringify(boldData) },
        { status: 500 }
      );
    }

    // Extraer la URL del link de pago y el paymentLinkId
    const paymentUrl = boldData.payload?.url || boldData.url || boldData.payment_link;
    const paymentLinkId = boldData.payload?.payment_link || boldData.payment_link;

    if (!paymentUrl) {
      console.error("[Bold Product API] No se encontró URL de pago en respuesta:", JSON.stringify(boldData));
      return NextResponse.json(
        { error: "Error: No se recibió URL de pago de Bold", details: JSON.stringify(boldData) },
        { status: 500 }
      );
    }

    // Actualizar el payment con la respuesta de Bold y el paymentLinkId
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayResponse: boldData,
          // Actualizar transactionId con el paymentLinkId de Bold para consultas futuras
          transactionId: paymentLinkId
        }
      });
    }

    console.log("[Bold Product API] Payment URL generada:", paymentUrl);
    console.log("[Bold Product API] Payment Link ID:", paymentLinkId);

    const duration = Date.now() - startTime;
    console.log(`[Bold Product API] Request completado en ${duration}ms`);

    return NextResponse.json({
      success: true,
      paymentUrl,           // URL completa del link de pago
      productOrderId: productOrder.id,
      product: {
        id: product.id,
        nombre: product.nombre,
        precio: product.precio,
        imagen: product.imagen,
      },
      quantity,
      priceBreakdown: {
        subtotal: subtotal,
        iva: ivaAmountPesos,
        total: totalAmount,
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Bold Product API] Error completo (${duration}ms):`, error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al preparar el pago", details: errorMessage },
      { status: 500 }
    );
  }
}
