export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const ALLOWED_EVENTS = new Set(["payment.success", "payment.succeeded"]);

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: NextRequest) {
  const receivedAt = new Date().toISOString();

  try {
    const payload = await request.json();
    console.log(`[Bold Webhook] [${receivedAt}] Payload received:`, payload);

    // Extraer datos del payload (soporta ambos formatos)
    const event = payload?.event as string | undefined;
    const data = payload?.data ?? payload;

    const reference = safeString(data?.reference);
    const status = safeString(data?.status);
    const transactionId = safeString(data?.id || data?.transaction_id);
    const amount = data?.amount as number | undefined;
    const paymentMethod = safeString(data?.payment_method);

    const customerName = safeString(data?.customer_data?.full_name);
    const customerEmail = safeString(data?.customer_data?.email);
    const shippingPhone = safeString(data?.customer_data?.phone);
    const shippingAddress = safeString(data?.shipping_address?.address);
    const shippingCity = safeString(data?.shipping_address?.city);

    // Solo procesar eventos de éxito
    if (event && !ALLOWED_EVENTS.has(event)) {
      console.log(`[Bold Webhook] Event ignored:`, event);
      return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }

    // Validar campos requeridos
    if (!reference || !status) {
      console.error(`[Bold Webhook] Missing reference or status`);
      return NextResponse.json({ received: true, processed: false }, { status: 200 });
    }

    // Buscar orden por boldReference
    const productOrder = await (prisma as any).productOrder.findUnique({
      where: { boldReference: reference },
      include: { sede: true, user: true, payment: true },
    });

    if (!productOrder) {
      console.error(`[Bold Webhook] Order not found for reference:`, reference);
      return NextResponse.json({ received: true, processed: false }, { status: 200 });
    }

    // IDEMPOTENCIA: Si ya tiene paymentId, no reprocesar
    if (productOrder.paymentId) {
      console.log(`[Bold Webhook] Order already processed, skipping:`, {
        orderId: productOrder.id,
        paymentId: productOrder.paymentId,
      });
      return NextResponse.json(
        { received: true, processed: true, duplicated: true },
        { status: 200 }
      );
    }

    // Procesar solo si el pago fue aprobado
    if (status === "APPROVED") {
      await prisma.$transaction(async (tx) => {
        // 1. Crear registro de pago
        const payment = await tx.payment.create({
          data: {
            sedeId: productOrder.sedeId,
            amount: amount || productOrder.totalPrice,
            paymentMethod: paymentMethod || "BOLD",
            status: "PAID",
            transactionId: transactionId || `BOLD-${Date.now()}`,
            gatewayResponse: payload,
          },
        });

        // 2. Actualizar ProductOrder con datos del cliente y pago
        await (tx as any).productOrder.update({
          where: { id: productOrder.id },
          data: {
            status: "PAID",
            paymentId: payment.id,
            customerName: customerName || productOrder.customerName,
            customerEmail: customerEmail || productOrder.customerEmail,
            shippingAddress: shippingAddress || productOrder.shippingAddress,
            shippingCity: shippingCity || productOrder.shippingCity,
            shippingPhone: shippingPhone || productOrder.shippingPhone,
          },
        });

        // 3. Descontar stock del producto
        if (productOrder.productId) {
          await tx.producto.update({
            where: { id: productOrder.productId },
            data: {
              stock: {
                decrement: productOrder.quantity,
              },
            },
          });
        }

        console.log(`[Bold Webhook] Order processed successfully:`, {
          orderId: productOrder.id,
          paymentId: payment.id,
          reference,
          amount: amount || productOrder.totalPrice,
        });
      });

      return NextResponse.json(
        { received: true, processed: true, type: "product" },
        { status: 200 }
      );
    }

    // Si el pago fue rechazado
    if (status === "REJECTED" || status === "DECLINED") {
      await (prisma as any).productOrder.update({
        where: { id: productOrder.id },
        data: { status: "CANCELLED" },
      });

      console.log(`[Bold Webhook] Order cancelled:`, {
        orderId: productOrder.id,
        reference,
        status,
      });

      return NextResponse.json(
        { received: true, processed: true, status: "cancelled" },
        { status: 200 }
      );
    }

    // Otros estados
    return NextResponse.json(
      { received: true, processed: false, status: "ignored" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`[Bold Webhook] [${receivedAt}] Error:`, error?.message || error);
    // SIEMPRE responder 200 para evitar reintentos de Bold
    return NextResponse.json({ received: true, processed: false }, { status: 200 });
  }
}

// Endpoint GET para verificar que el webhook está activo
export async function GET() {
  return NextResponse.json({
    status: "Webhook activo",
    timestamp: new Date().toISOString(),
  });
}
