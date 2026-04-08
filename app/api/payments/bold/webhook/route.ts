export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * Webhook de Bold para confirmar pagos de forma segura
 * Bold envía notificaciones cuando un pago cambia de estado
 */

// Para producción, la API Key de webhook debería venir de variable de entorno
const BOLD_WEBHOOK_SECRET = process.env.BOLD_WEBHOOK_SECRET || "";

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: NextRequest) {
  const receivedAt = new Date().toISOString();
  try {
    const body = await request.text();
    const signature = request.headers.get("x-bold-signature") || "";

    // Verificar firma del webhook (en producción implementar verificación HMAC)
    // const isValid = verifyWebhookSignature(body, signature, BOLD_WEBHOOK_SECRET);
    // if (!isValid) {
    //   return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    // }

    const payload = JSON.parse(body) as any;
    console.log("[Bold Webhook] Payload recibido:", payload);

    // Soportar ambos formatos:
    // 1) { event, data: { id, reference, amount, status, transaction_id, customer_data, shipping_address } }
    // 2) { reference, status, transaction_id, ... }
    const event = payload?.event as string | undefined;
    const data = payload?.data ?? payload;

    const reference = safeString(data?.reference || payload?.reference);
    const status = safeString(data?.status || payload?.status);
    const transactionId = safeString(data?.transaction_id || payload?.transaction_id || data?.id);

    const customerName = safeString(data?.customer_data?.full_name);
    const customerEmail = safeString(data?.customer_data?.email);
    const shippingAddress = safeString(data?.shipping_address?.address);
    const shippingCity = safeString(data?.shipping_address?.city);
    const shippingCountry = safeString(data?.shipping_address?.country);
    const shippingPhone = safeString(data?.customer_data?.phone);

    // Solo procesar eventos de éxito si vienen en el formato {event: ...}
    if (event && event !== "payment.success" && event !== "payment.succeeded") {
      console.log("[Bold Webhook] Evento ignorado:", event);
      return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }

    // Validación mínima
    if (!reference || !status) {
      console.log("[Bold Webhook] Payload incompleto (reference/status)");
      return NextResponse.json({ received: true, processed: false }, { status: 200 });
    }

    // Buscar orden de producto por reference (guardado como boldReference)
    const productOrder = await (prisma as any).productOrder.findUnique({
      where: { boldReference: reference },
      include: { product: true, user: true },
    });

    // PlanOrder: este proyecto no guarda reference, así que por ahora lo dejamos como estaba (best-effort)
    const planOrder = !productOrder
      ? await prisma.planOrder.findFirst({
          where: {
            status: "PENDING",
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000),
            },
          },
          include: { plan: true, user: true },
          orderBy: { createdAt: "desc" },
        })
      : null;

    if (!productOrder && !planOrder) {
      console.log("[Bold Webhook] Orden no encontrada para reference:", reference);
      return NextResponse.json({ received: true, processed: false }, { status: 200 });
    }

    // Procesar según el estado del pago
    if (status === "APPROVED") {
      // Es un pago de PRODUCTO
      if (productOrder) {
        await prisma.$transaction(async (tx) => {
          // Deduplicación: si ya tiene paymentId, no reprocesar
          if (productOrder.paymentId) {
            console.log("[Bold Webhook] Orden ya procesada (paymentId existe):", {
              productOrderId: productOrder.id,
              paymentId: productOrder.paymentId,
            });
            return;
          }

          // 1. Crear el registro de pago
          const payment = await tx.payment.create({
            data: {
              sedeId: productOrder!.sedeId,
              amount: productOrder!.totalPrice,
              paymentMethod: "BOLD",
              status: "PAID",
              transactionId: transactionId || `BOLD-PROD-${Date.now()}`,
              gatewayResponse: payload,
            },
          });

          // 2. Actualizar la orden de producto
          await (tx as any).productOrder.update({
            where: { id: productOrder!.id },
            data: {
              status: "CONFIRMED",
              paymentId: payment.id,
              customerName: customerName || (productOrder as any).customerName,
              customerEmail: customerEmail || (productOrder as any).customerEmail,
              shippingAddress: shippingAddress || productOrder.shippingAddress,
              shippingCity: shippingCity || productOrder.shippingCity,
              shippingCountry: shippingCountry || (productOrder as any).shippingCountry,
              shippingPhone: shippingPhone || productOrder.shippingPhone,
            },
          });

          // 3. Descontar stock del producto principal
          if (!productOrder!.productId) {
            console.warn("[Bold Webhook] productId vacío, no se descuenta stock:", {
              productOrderId: productOrder!.id,
            });
            return;
          }

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

        return NextResponse.json({ success: true, type: "product" }, { status: 200 });
      }

      // Es un pago de PLAN
      if (planOrder) {
        await prisma.$transaction(async (tx) => {
          if (planOrder.paymentId) {
            console.log("[Bold Webhook] PlanOrder ya procesada (paymentId existe):", {
              planOrderId: planOrder.id,
              paymentId: planOrder.paymentId,
            });
            return;
          }

          // 1. Crear el registro de pago
          const payment = await tx.payment.create({
            data: {
              sedeId: planOrder.sedeId,
              amount: planOrder.totalPrice,
              paymentMethod: "BOLD",
              status: "PAID",
              transactionId: transactionId || `BOLD-${Date.now()}`,
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

        return NextResponse.json({ success: true, type: "plan" }, { status: 200 });
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

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Otros estados (PENDING, etc.)
    return NextResponse.json({ success: true, status: "ignored" }, { status: 200 });

  } catch (error) {
    console.error("[Bold Webhook] Error:", error);
    // Siempre 200 para evitar reintentos
    return NextResponse.json({ received: true, processed: false }, { status: 200 });
  }
}

// Endpoint GET para verificar que el webhook está activo
export async function GET() {
  return NextResponse.json({ 
    status: "Webhook activo", 
    timestamp: new Date().toISOString() 
  });
}
