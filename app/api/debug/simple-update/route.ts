import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    console.log(`[SIMPLE DEBUG] Iniciando simulación...`);
    
    const body = await request.json();
    const { orderId } = body;

    console.log(`[SIMPLE DEBUG] OrderID: ${orderId}`);

    // Buscar la orden
    const productOrder = await prisma.productOrder.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!productOrder) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    console.log(`[SIMPLE DEBUG] Orden encontrada:`, {
      id: productOrder.id,
      status: productOrder.status,
      paymentId: productOrder.paymentId,
      hasPayment: !!productOrder.payment
    });

    // Solo actualizar si está PENDING
    if (productOrder.status === "PENDING") {
      console.log(`[SIMPLE DEBUG] Actualizando orden a PAID...`);
      
      // Crear payment simple
      const payment = await prisma.payment.create({
        data: {
          sedeId: productOrder.sedeId,
          amount: productOrder.totalPrice,
          paymentMethod: "CARD", // Métodos reales: CARD, PSE, NEQUI, etc.
          status: "COMPLETED",
          transactionId: `SIMPLE_${Date.now()}`,
          gatewayResponse: { 
            debug: true,
            payment_method: "CARD",
            payment_type: "credit_card"
          },
        },
      });

      // Actualizar orden
      await prisma.productOrder.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paymentId: payment.id,
        },
      });

      console.log(`[SIMPLE DEBUG] ✅ Orden actualizada:`, {
        orderId,
        paymentId: payment.id,
        newStatus: "PAID"
      });
    }

    return NextResponse.json({
      success: true,
      message: "Simulación completada",
      orderId,
      currentStatus: productOrder.status
    });

  } catch (error: any) {
    console.error(`[SIMPLE DEBUG] Error:`, error?.message || error);
    return NextResponse.json({
      error: error?.message || "Error desconocido"
    }, { status: 500 });
  }
}
