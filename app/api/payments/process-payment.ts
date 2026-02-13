import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, paymentMethod } = body;

    if (!paymentId || !paymentMethod) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Obtener la orden
    const order = await prisma.order.findUnique({
      where: { id: paymentId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Simular procesamiento del pago
    // En una implementación real, aquí se integraría con Wompi o Nequi
    let paymentStatus = "PENDING";
    let paymentUrl = null;

    if (paymentMethod === "card") {
      // Simular integración con Wompi
      paymentStatus = "PROCESSING";
      paymentUrl = `https://checkout.wompi.co/pay/${paymentId}`;
    } else if (paymentMethod === "nequi") {
      // Simular integración con Nequi
      paymentStatus = "AWAITING_QR";
      paymentUrl = `https://nequi.co/qr/${paymentId}`;
    }

    // Actualizar estado de la orden
    const updatedOrder = await prisma.order.update({
      where: { id: paymentId },
      data: {
        paymentMethod,
        paymentStatus,
      },
    });

    // Simular respuesta del procesador de pagos
    const success = Math.random() > 0.2; // 80% de éxito para demostración

    if (success) {
      await prisma.order.update({
        where: { id: paymentId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Pago procesado exitosamente",
        order: updatedOrder,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Error en el procesamiento del pago",
        paymentUrl,
      });
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "Error al procesar el pago" },
      { status: 500 }
    );
  }
}
