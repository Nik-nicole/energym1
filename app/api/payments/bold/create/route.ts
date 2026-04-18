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
    console.log("[Bold API] Recibiendo solicitud de creación de pago");
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("[Bold API] Error: No autorizado - sin sesión");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Rate limiting por usuario
    if (!checkRateLimit(session.user.email)) {
      console.log("[Bold API] Rate limit exceeded:", session.user.email);
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta en un minuto." },
        { status: 429 }
      );
    }

    console.log("[Bold API] Usuario autenticado:", session.user.email);

    const { planId } = await request.json();
    console.log("[Bold API] Plan ID recibido:", planId);

    if (!planId) {
      console.log("[Bold API] Error: planId no proporcionado");
      return NextResponse.json({ error: "planId requerido" }, { status: 400 });
    }

    // 1. Ejecutar queries en paralelo para mejor rendimiento
    const [user, plan] = await Promise.all([
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
      // Obtener el plan
      prisma.plan.findUnique({
        where: { id: planId, activo: true },
      }),
    ]);

    if (!user) {
      console.log("[Bold API] Error: Usuario no encontrado");
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (!plan) {
      console.log("[Bold API] Error: Plan no encontrado o inactivo:", planId);
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    // 2. Verificar que el usuario tenga sede con PaymentGateway
    if (!user.sede?.paymentGateway) {
      console.log("[Bold API] Error: Sede sin payment gateway:", user.sedeId);
      return NextResponse.json({
        error: "Tu sede no tiene una pasarela de pago configurada"
      }, { status: 400 });
    }

    // 4. Verificar que el plan esté disponible en la sede del usuario
    const planSede = await prisma.planSede.findFirst({
      where: {
        planId: planId,
        sedeId: user.sedeId!,
      },
    });

    if (!planSede) {
      console.log("[Bold API] Error: Plan no disponible en sede:", {
        planId,
        sedeId: user.sedeId
      });
      return NextResponse.json({
        error: "Este plan no está disponible en tu sede"
      }, { status: 400 });
    }

    // 4. La cuentaBanco contiene el NOMBRE de la variable de entorno (ej: BOLD_API_KEY_SEDE1)
    const envVarName = user.sede.paymentGateway.cuentaBanco;
    
    // Resolver el valor real desde process.env
    const boldApiKey = envVarName ? process.env[envVarName] : null;
    
    console.log("[Bold API] Env var name:", envVarName);
    console.log("[Bold API] Resolved API Key (first 10 chars):", boldApiKey ? boldApiKey.substring(0, 10) + "..." : "NOT FOUND");

    // Validar que existe API Key
    if (!boldApiKey || boldApiKey.length < 10) {
      console.log("[Bold API] Error: API Key no encontrada en env para variable:", envVarName);
      return NextResponse.json({
        error: "Configuración de pago incompleta - API Key no configurada"
      }, { status: 500 });
    }

    // 6. Preparar datos para el botón de Bold (sin IVA, Bold lo calcula automáticamente)
    const totalAmount = plan.precio; // Precio exacto del plan, Bold calcula IVA
    
    // Generar referencia única
    const reference = `ENRG-${user.id.slice(0, 8)}-${plan.id.slice(0, 8)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .substring(0, 60);

    // 7. Crear registro de Payment y PlanOrder dentro de transacción atómica
    const { planOrder, payment } = await prisma.$transaction(async (tx) => {
      // Verificar que no existe una orden pendiente reciente (evita duplicados)
      const existingOrder = await tx.planOrder.findFirst({
        where: {
          userId: user.id,
          planId: plan.id,
          status: "PENDING",
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Últimos 5 minutos
          },
        },
      });

      if (existingOrder) {
        console.log("[Bold API] Orden pendiente existente encontrada:", existingOrder.id);
        // Devolver la orden existente y su pago asociado
        const existingPayment = await tx.payment.findUnique({
          where: { id: existingOrder.paymentId! }
        });
        return { planOrder: existingOrder, payment: existingPayment };
      }

      // Crear registro de pago primero
      const paymentRecord = await tx.payment.create({
        data: {
          sedeId: user.sedeId!,
          amount: plan.precio,
          paymentMethod: 'BOLD',
          status: 'PENDING',
          transactionId: reference, // Usar la referencia como transactionId
          gatewayResponse: {}
        }
      });

      // Crear nueva orden asociada al pago
      const order = await tx.planOrder.create({
        data: {
          userId: user.id,
          planId: plan.id,
          paymentId: paymentRecord.id, // Asociar con el pago
          sedeId: user.sedeId!,
          quantity: 1,
          unitPrice: plan.precio,
          totalPrice: plan.precio, // Sin IVA, Bold lo maneja
          status: "PENDING",
        },
      });

      console.log("[Bold API] Payment creado:", paymentRecord.id);
      console.log("[Bold API] PlanOrder creado:", order.id);
      return { planOrder: order, payment: paymentRecord };
    });

    // 8. Llamar a la API de Bold para generar el link de pago
    const boldApiUrl = "https://integrations.api.bold.co/online/link/v1";
    
    // Bold rechaza "localhost" con 403 Forbidden. Usamos la URL de producción obligatoriamente.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://energym1-five.vercel.app";
    const publicOrigin = baseUrl.includes("localhost") ? "https://energym1-five.vercel.app" : baseUrl;
    
    const returnUrl = `${publicOrigin}/payment/return?link_id={bold-order-id}`;

    const boldPayload: any = {
      amount_type: "CLOSE",
      amount: {
        currency: "COP",
        total_amount: totalAmount,
      },
      reference: reference,
      description: `Plan ${plan.nombre} - Energym`,
      callback_url: callbackUrl,
      redirection_url: redirectionUrl,
      image_url: `${publicOrigin}/logo.png`,
    };
    
    // Solo agregar expiration_date si es necesario (probar sin ella primero)
    // expiration_date: Math.floor((Date.now() + 2 * 60 * 60 * 1000) * 1000),

    console.log("REDIRECTION URL:", redirectionUrl);
    console.log("[Bold API] Llamando a Bold API...");
    console.log("[Bold API] URL:", boldApiUrl);
    console.log("[Bold API] Payload:", JSON.stringify(boldPayload, null, 2));

    const boldResponse = await fetch(boldApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `x-api-key ${boldApiKey}`,
      },
      body: JSON.stringify(boldPayload),
    });

    const boldData = await boldResponse.json();
    console.log("[Bold API] Respuesta:", boldResponse.status, JSON.stringify(boldData, null, 2));

    if (!boldResponse.ok) {
      console.error("[Bold API] Error de Bold:", boldResponse.status, JSON.stringify(boldData));
      return NextResponse.json(
        { error: "Error al generar el link de pago con Bold", details: JSON.stringify(boldData) },
        { status: 500 }
      );
    }

    // Extraer la URL del link de pago y el paymentLinkId
    const paymentUrl = boldData.payload?.url || boldData.url || boldData.payment_link;
    const paymentLinkId = boldData.payload?.payment_link || boldData.payment_link;
    
    if (!paymentUrl) {
      console.error("[Bold API] No se encontró URL de pago en respuesta:", JSON.stringify(boldData));
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

    console.log("[Bold API] Payment URL generada:", paymentUrl);
    console.log("[Bold API] Payment Link ID:", paymentLinkId);

    const duration = Date.now() - startTime;
    console.log(`[Bold API] Request completado en ${duration}ms`);

    return NextResponse.json({
      success: true,
      paymentUrl,           // URL completa del link de pago
      planOrderId: planOrder.id,
      plan: {
        id: plan.id,
        nombre: plan.nombre,
        precio: plan.precio,
        duracion: plan.duracion,
      },
      // IVA removido - Bold lo calcula automáticamente
      priceBreakdown: {
        subtotal: plan.precio,
        total: plan.precio,
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Bold API] Error completo (${duration}ms):`, error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al preparar el pago", details: errorMessage },
      { status: 500 }
    );
  }
}
