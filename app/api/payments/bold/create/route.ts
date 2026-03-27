export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

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

    // 6. Calcular totales y preparar datos para el botón de Bold
    const subtotal = plan.precio;
    const ivaRate = 0.19;
    const totalAmount = Math.round(subtotal * (1 + ivaRate) * 100); // Total en centavos para Bold
    
    // Generar referencia única
    const reference = `ENRG-${user.id.slice(0, 8)}-${plan.id.slice(0, 8)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .substring(0, 60);

    // 7. Crear registro de PlanOrder dentro de transacción atómica
    const planOrder = await prisma.$transaction(async (tx) => {
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
        return existingOrder;
      }

      // Crear nueva orden
      const order = await tx.planOrder.create({
        data: {
          userId: user.id,
          planId: plan.id,
          sedeId: user.sedeId!,
          quantity: 1,
          unitPrice: plan.precio,
          totalPrice: plan.precio * 1.19,
          status: "PENDING",
        },
      });

      console.log("[Bold API] PlanOrder creado:", order.id);
      return order;
    });

    // 8. Llamar a la API de Bold para generar el link de pago
    const boldApiUrl = "https://integrations.api.bold.co/online/link/v1";
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://energym1-five.vercel.app";
    const callbackUrl = `${origin}/pago/confirmacion/bold?planOrderId=${planOrder.id}`;

    // Calcular IVA en pesos (no centavos) para la API de Bold
    const ivaAmountPesos = Math.round(subtotal * ivaRate);
    const totalAmountPesos = Math.round(subtotal * (1 + ivaRate));

    const boldPayload: any = {
      amount_type: "CLOSE",
      amount: {
        currency: "COP",
        total_amount: totalAmountPesos,
        taxes: [
          {
            type: "VAT",
            base: subtotal,
            value: ivaAmountPesos,
          },
        ],
      },
      reference: reference,
      description: `Plan ${plan.nombre} - Energym`,
      callback_url: callbackUrl,
      image_url: `${origin}/logo.png`,
    };
    
    // Solo agregar expiration_date si es necesario (probar sin ella primero)
    // expiration_date: Math.floor((Date.now() + 2 * 60 * 60 * 1000) * 1000),

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

    // Extraer la URL del link de pago
    const paymentUrl = boldData.payload?.url || boldData.url || boldData.payment_link;
    
    if (!paymentUrl) {
      console.error("[Bold API] No se encontró URL de pago en respuesta:", JSON.stringify(boldData));
      return NextResponse.json(
        { error: "Error: No se recibió URL de pago de Bold", details: JSON.stringify(boldData) },
        { status: 500 }
      );
    }

    console.log("[Bold API] Payment URL generada:", paymentUrl);

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
      priceBreakdown: {
        subtotal: subtotal,
        iva: ivaAmountPesos,
        total: totalAmountPesos,
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
