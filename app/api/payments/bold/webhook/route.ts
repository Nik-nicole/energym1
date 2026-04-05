export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * Webhook de Bold para confirmar pagos de forma segura
 * Bold envía notificaciones cuando un pago cambia de estado
 */

// Para producción, la API Key de webhook debería venir de variable de entorno
const BOLD_WEBHOOK_SECRET = process.env.BOLD_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-bold-signature") || "";

    // Verificar firma del webhook (en producción implementar verificación HMAC)
    // const isValid = verifyWebhookSignature(body, signature, BOLD_WEBHOOK_SECRET);
    // if (!isValid) {
    //   return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    // }

    const payload = JSON.parse(body);
    console.log("[Bold Webhook] Payload recibido:", payload);

    const { 
      reference, 
      status, 
      transaction_id,
      metadata 
    } = payload;

    // Validar campos requeridos
    if (!reference || !status) {
      return NextResponse.json(
        { error: "Payload incompleto" }, 
        { status: 400 }
      );
    }

    // Buscar la orden por reference - puede ser PlanOrder o ProductOrder
    let planOrder = await prisma.planOrder.findFirst({
      where: {
        status: "PENDING",
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Última hora
        },
      },
      include: { plan: true, user: true },
      orderBy: { createdAt: "desc" },
    });

    // Si no es un plan, buscar orden de producto
    let productOrder = null;
    if (!planOrder) {
      productOrder = await prisma.productOrder.findFirst({
        where: {
          status: "PENDING",
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000),
          },
        },
        include: { product: true, user: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!planOrder && !productOrder) {
      console.log("[Bold Webhook] Orden no encontrada para reference:", reference);
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Procesar según el estado del pago
    if (status === "APPROVED") {
      // Es un pago de PRODUCTO
      if (productOrder) {
        await prisma.$transaction(async (tx) => {
          // 1. Crear el registro de pago
          const payment = await tx.payment.create({
            data: {
              sedeId: productOrder!.sedeId,
              amount: productOrder!.totalPrice,
              paymentMethod: "BOLD",
              status: "PAID",
              transactionId: transaction_id || `BOLD-PROD-${Date.now()}`,
              gatewayResponse: payload,
            },
          });

          // 2. Actualizar la orden de producto
          await tx.productOrder.update({
            where: { id: productOrder!.id },
            data: {
              status: "CONFIRMED",
              paymentId: payment.id,
            },
          });

          // 3. Descontar stock del producto principal
          await tx.producto.update({
            where: { id: productOrder!.productId },
            data: {
              stock: {
                decrement: productOrder!.quantity,
              },
            },
          });

          console.log("[Bold Webhook] Pago de producto procesado:", {
            paymentId: payment.id,
            productOrderId: productOrder!.id,
            productId: productOrder!.productId,
            quantity: productOrder!.quantity,
          });
        });

        return NextResponse.json({ success: true, type: "product" });
      }

      // Es un pago de PLAN
      if (planOrder) {
        await prisma.$transaction(async (tx) => {
          // 1. Crear el registro de pago
          const payment = await tx.payment.create({
            data: {
              sedeId: planOrder.sedeId,
              amount: planOrder.totalPrice,
              paymentMethod: "BOLD",
              status: "PAID",
              transactionId: transaction_id || `BOLD-${Date.now()}`,
              gatewayResponse: payload,
            },
          });

          // 2. Actualizar la orden
          await tx.planOrder.update({
            where: { id: planOrder.id },
            data: {
              status: "CONFIRMED",
              paymentId: payment.id,
            },
          });

          // 3. Calcular fechas del plan
          const startDate = new Date();
          const endDate = new Date();
          const duracion = planOrder.plan.duracion.toLowerCase();

          if (duracion.includes("mes")) {
            const meses = parseInt(duracion) || 1;
            endDate.setMonth(endDate.getMonth() + meses);
          } else if (duracion.includes("año") || duracion.includes("year")) {
            endDate.setFullYear(endDate.getFullYear() + 1);
          } else {
            endDate.setMonth(endDate.getMonth() + 1);
          }

          // 4. Activar el plan para el usuario
          await tx.userPlan.upsert({
            where: {
              userId_planId: {
                userId: planOrder.userId,
                planId: planOrder.planId,
              },
            },
            update: {
              isActive: true,
              startDate,
              endDate,
              paymentId: payment.id,
            },
            create: {
              userId: planOrder.userId,
              planId: planOrder.planId,
              startDate,
              endDate,
              isActive: true,
              paymentId: payment.id,
            },
          });

          console.log("[Bold Webhook] Pago de plan procesado:", {
            paymentId: payment.id,
            planOrderId: planOrder!.id,
            userId: planOrder!.userId,
          });
        });

        return NextResponse.json({ success: true, type: "plan" });
      }
    }
    
    // Pago rechazado - actualizar orden según el tipo
    if (status === "REJECTED" || status === "DECLINED") {
      if (productOrder) {
        await prisma.productOrder.update({
          where: { id: productOrder.id },
          data: { status: "CANCELLED" },
        });
        console.log("[Bold Webhook] Pago de producto rechazado:", {
          productOrderId: productOrder.id,
          reference,
        });
      }
      
      if (planOrder) {
        await prisma.planOrder.update({
          where: { id: planOrder.id },
          data: { status: "CANCELLED" },
        });
        console.log("[Bold Webhook] Pago de plan rechazado:", {
          planOrderId: planOrder.id,
          reference,
        });
      }

      return NextResponse.json({ success: true });
    }

    // Otros estados (PENDING, etc.)
    return NextResponse.json({ success: true, status: "ignored" });

  } catch (error) {
    console.error("[Bold Webhook] Error:", error);
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar que el webhook está activo
export async function GET() {
  return NextResponse.json({ 
    status: "Webhook activo", 
    timestamp: new Date().toISOString() 
  });
}
