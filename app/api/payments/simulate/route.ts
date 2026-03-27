import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// Mapeo explícito de variables de entorno para Bold
// Esto asegura que Next.js incluya estas variables en el build
const BOLD_API_KEYS: Record<string, string | undefined> = {
  BOLD_API_KEY_SEDE1: process.env.BOLD_API_KEY_SEDE1,
  BOLD_API_KEY_SEDE2: process.env.BOLD_API_KEY_SEDE2,
  BOLD_API_KEY_SEDE3: process.env.BOLD_API_KEY_SEDE3,
  BOLD_API_KEY_SEDE4: process.env.BOLD_API_KEY_SEDE4,
  BOLD_API_KEY_SEDE5: process.env.BOLD_API_KEY_SEDE5,
  BOLD_API_KEY: process.env.BOLD_API_KEY,
};

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: "planId requerido" }, { status: 400 });
    }

    // 1. Obtener usuario con sede
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

    // 2. Verificar que el usuario tenga sede
    if (!user.sedeId) {
      return NextResponse.json({ 
        error: "No tienes una sede asignada" 
      }, { status: 400 });
    }

    // 3. Obtener el plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId, activo: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    // 4. Verificar que el plan esté disponible en la sede del usuario y obtener la sede con su PaymentGateway
    const planSede = await prisma.planSede.findFirst({
      where: {
        planId: planId,
        sedeId: user.sedeId!,
      },
      include: {
        sede: {
          include: {
            paymentGateway: true,
          },
        },
      },
    });

    if (!planSede) {
      console.error("Plan no disponible en la sede del usuario:", planId, user.sedeId);
      return NextResponse.json({ 
        error: "Este plan no está disponible en tu sede", 
        details: { planId, sedeId: user.sedeId } 
      }, { status: 400 });
    }

    // 5. Obtener la API key de Bold desde la sede del plan (no del usuario)
    if (!planSede.sede.paymentGateway) {
      return NextResponse.json({ 
        error: "La sede del plan no tiene una pasarela de pago configurada" 
      }, { status: 400 });
    }
    
    const envVarName = planSede.sede.paymentGateway.cuentaBanco;
    // Buscar en el mapeo de variables de entorno
    const envValue = BOLD_API_KEYS[envVarName];
    const boldApiKey = envVarName.startsWith("BOLD_API_KEY") 
      ? envValue || envVarName  // Fallback al valor directo si no está en env
      : envVarName;  // Si no parece variable env, usar directamente
    
    console.log("[BOLD DEBUG] API Key resolution:", {
      cuentaBanco_raw: envVarName,
      startsWith_BOLD_API_KEY: envVarName.startsWith("BOLD_API_KEY"),
      envValue_exists: !!envValue,
      envValue_length: envValue?.length || 0,
      final_key_length: boldApiKey?.length || 0,
      // Verificar primer y último caracter para detectar espacios invisibles
      first_char: boldApiKey ? boldApiKey.charAt(0) : null,
      last_char: boldApiKey ? boldApiKey.charAt(boldApiKey.length - 1) : null,
      last_char_code: boldApiKey ? boldApiKey.charCodeAt(boldApiKey.length - 1) : null,
    });
    
    // Verificar que tenemos una API key válida
    if (!boldApiKey || boldApiKey === envVarName && envVarName.startsWith("BOLD_API_KEY") && !envValue) {
      // La variable de entorno no existe o está vacía
      return NextResponse.json({
        error: "Error de configuración: No se encontró la API key de Bold",
        debug: {
          envVarName,
          envValueExists: !!envValue,
          envValueLength: envValue?.length || 0,
          availableBoldKeys: Object.keys(BOLD_API_KEYS).filter(k => BOLD_API_KEYS[k]),
        }
      }, { status: 500 });
    }

    // 6. Calcular impuestos - plan.precio ya incluye IVA (es el total final)
    const totalAmount = Math.round(plan.precio * 100); // Precio total en centavos (con IVA)
    const ivaRate = 0.19;
    // Calcular base (sin IVA) a partir del total: base = total / 1.19
    const subtotalCents = Math.round(totalAmount / (1 + ivaRate)); 
    const ivaAmount = totalAmount - subtotalCents; // IVA = total - base

    // 7. Generar referencia única (solo alfanumérica para Bold)
    const randomNum = Math.floor(Math.random() * 1000000);
    const timestamp = Date.now().toString().slice(-6);
    const reference = `ENRGYM${timestamp}${randomNum}`.substring(0, 30);

    // 8. Construir el JSON que Bold necesita
    const boldPaymentData = {
      amount_type: "CLOSE",
      amount: {
        currency: "COP",
        total_amount: totalAmount,
        tip_amount: 0,
        taxes: [
          {
            type: "VAT",
            base: subtotalCents,
            value: ivaAmount,
          },
        ],
      },
      reference: reference,
      description: plan.nombre,
      image_url: "https://energym1-five.vercel.app/logo.png",
    };

    // 9. Crear registro de PlanOrder en estado PENDING antes de redirigir
    const planOrder = await prisma.planOrder.create({
      data: {
        userId: user.id,
        planId: plan.id,
        sedeId: planSede.sedeId,
        quantity: 1,
        unitPrice: plan.precio,
        totalPrice: plan.precio,
        status: "PENDING",
      },
    });

    console.log("[BOLD DEBUG] Request payload:", JSON.stringify(boldPaymentData, null, 2));
    console.log("[BOLD DEBUG] Headers:", { "Authorization": `x-api-key ${boldApiKey}` });

    // 10. Llamar directamente a la API de Bold para crear el link de pago
    const boldResponse = await fetch("https://integrations.api.bold.co/online/link/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "User-Agent": "PostmanRuntime/7.51.1",
        "Authorization": `x-api-key ${boldApiKey}`,
      },
      body: JSON.stringify(boldPaymentData),
    });

    if (!boldResponse.ok) {
      let errorData;
      try {
        errorData = await boldResponse.json();
      } catch {
        errorData = { message: await boldResponse.text() };
      }
      console.error("Bold API error:", errorData);
      return NextResponse.json(
        { error: "Error al crear el link de pago en Bold", details: errorData },
        { status: 500 }
      );
    }

    const boldResult = await boldResponse.json();

    return NextResponse.json({
      success: true,
      paymentUrl: boldResult.url || boldResult.payment_url || boldResult.link,
      planOrderId: planOrder.id,
      plan: {
        id: plan.id,
        nombre: plan.nombre,
        precio: plan.precio,
        duracion: plan.duracion,
      },
    });

  } catch (error) {
    console.error("Error creating Bold payment:", error);
    return NextResponse.json(
      { error: "Error al preparar el pago" },
      { status: 500 }
    );
  }
}