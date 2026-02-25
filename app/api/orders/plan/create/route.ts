import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { WompiService } from "@/lib/wompi";

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
      planId,
      sedeId,
      quantity,
      unitPrice,
      totalPrice,
      paymentInfo
    } = body;

    // Validar datos
    if (!planId || !sedeId || !unitPrice || !totalPrice || !paymentInfo) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Verificar que el plan exista y esté activo
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan || !plan.activo) {
      return NextResponse.json({ error: "Plan no disponible" }, { status: 404 });
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

    // Verificar que el plan esté disponible en esta sede
    const planSede = await prisma.planSede.findUnique({
      where: {
        planId_sedeId: {
          planId,
          sedeId
        }
      }
    });

    if (!planSede) {
      return NextResponse.json({ error: "Plan no disponible en esta sede" }, { status: 400 });
    }

    // Verificar si el usuario ya tiene este plan activo
    const existingUserPlan = await prisma.userPlan.findFirst({
      where: {
        userId: user.id,
        planId: planId,
        isActive: true
      }
    });

    if (existingUserPlan) {
      return NextResponse.json({ error: "Ya tienes este plan activo" }, { status: 400 });
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

    // Crear la orden del plan
    const planOrder = await prisma.planOrder.create({
      data: {
        userId: user.id,
        planId: plan.id,
        sedeId: sede.id,
        paymentId: payment.id,
        quantity: quantity || 1,
        unitPrice,
        totalPrice,
        status: 'PAID' // Solo crear la orden si el pago fue exitoso
      },
      include: {
        plan: true,
        sede: true,
        payment: true
      }
    });

    // Activar el plan para el usuario
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    // Calcular fecha de fin según la duración del plan
    if (plan.duracion.includes('mes')) {
      const months = parseInt(plan.duracion) || 1;
      endDate.setMonth(endDate.getMonth() + months);
    } else if (plan.duracion.includes('año')) {
      const years = parseInt(plan.duracion) || 1;
      endDate.setFullYear(endDate.getFullYear() + years);
    } else {
      // Por defecto 1 mes
      endDate.setMonth(endDate.getMonth() + 1);
    }

    await prisma.userPlan.create({
      data: {
        userId: user.id,
        planId: plan.id,
        startDate,
        endDate,
        isActive: true,
        paymentId: payment.id
      }
    });

    // Enviar email de confirmación (simulado)
    console.log(`Email de confirmación enviado a ${user.email} para el plan ${plan.nombre}`);

    return NextResponse.json({
      success: true,
      order: planOrder,
      userPlan: {
        planId: plan.id,
        startDate,
        endDate,
        isActive: true
      },
      payment: wompiResponse,
      message: "Plan activado exitosamente"
    });

  } catch (error) {
    console.error("Error creating plan order:", error);
    return NextResponse.json(
      { error: "Error al activar el plan" },
      { status: 500 }
    );
  }
}
