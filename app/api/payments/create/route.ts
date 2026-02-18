export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { planId, amount, paymentMethod, cardName } = await request.json();

    if (!planId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // Verificar que el plan existe
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        sedes: {
          include: {
            sede: true
          }
        }
      }
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el usuario puede comprar este plan (validación de sede)
    console.log("Validando sede - Usuario:", {
      userId: session.user.id,
      userSedeId: session.user.sedeId,
      planId: planId,
      planSedes: plan.sedes
    });
    
    if (session.user.sedeId) {
      // Si el usuario tiene sede asignada, verificar que el plan esté disponible en esa sede
      // Si el plan no tiene sedes definidas, se asume que está disponible para todos
      if (!plan.sedes || plan.sedes.length === 0) {
        console.log("Plan sin sedes definidas, permitiendo compra");
        // Plan sin restricciones de sede, permitir compra
      } else {
        const isPlanAvailableInUserSede = plan.sedes.some(sede => sede.sede.id === session.user.sedeId);
        console.log("Verificando disponibilidad:", {
          userSedeId: session.user.sedeId,
          planSedes: plan.sedes.map(s => ({ id: s.sede.id, nombre: s.sede.nombre })),
          isAvailable: isPlanAvailableInUserSede
        });
        
        if (!isPlanAvailableInUserSede) {
          return NextResponse.json(
            { 
              error: "No puedes comprar este plan porque no pertenece a tu sede. Solo puedes comprar planes disponibles en tu sede actual.",
              code: "SEDE_RESTRICTION"
            },
            { status: 403 }
          );
        }
      }
    }

    // Determinar la sede a usar
    const sedeIdToUse = session.user.sedeId || plan.sedes[0]?.sede.id;
    
    if (!sedeIdToUse) {
      return NextResponse.json(
        { error: "El plan no tiene sedes disponibles" },
        { status: 400 }
      );
    }

    // Crear orden de plan usando el modelo correcto
    const order = await prisma.planOrder.create({
      data: {
        userId: session.user.id,
        planId: planId,
        sedeId: sedeIdToUse,
        quantity: 1,
        unitPrice: amount,
        totalPrice: amount,
        status: "PENDING",
      },
    });

    // Crear registro de pago
    const payment = await prisma.payment.create({
      data: {
        sedeId: sedeIdToUse,
        amount: amount,
        paymentMethod: paymentMethod,
        status: "PENDING",
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        gatewayResponse: {
          cardName: cardName || "Anónimo",
          planName: plan.nombre,
          planType: plan.tipo,
        }
      }
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      order: order,
      payment: payment,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
