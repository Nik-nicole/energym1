import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, transactionId, customerData } = body;

    console.log(`[DEBUG] Simulando callback Bold para orden: ${orderId}`);
    console.log(`[DEBUG] Transaction ID: ${transactionId}`);
    console.log(`[DEBUG] Customer data:`, customerData);

    if (!orderId || !transactionId) {
      return NextResponse.json({ 
        error: "Faltan campos requeridos: orderId, transactionId" 
      }, { status: 400 });
    }

    // Buscar la orden
    const productOrder = await prisma.productOrder.findUnique({
      where: { id: orderId },
      include: { product: true, user: true, sede: { include: { paymentGateway: true } } },
    });

    if (!productOrder) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    console.log(`[DEBUG] Orden encontrada - Status: ${productOrder.status}`);

    if (productOrder.status !== "PENDING") {
      return NextResponse.json({ 
        error: "Orden ya procesada",
        currentStatus: productOrder.status 
      }, { status: 400 });
    }

    // Crear payment
    const payment = await prisma.payment.create({
      data: {
        sedeId: productOrder.sedeId,
        amount: productOrder.totalPrice,
        paymentMethod: "BOLD",
        status: "COMPLETED",
        transactionId: transactionId,
        gatewayResponse: {
          debug: true,
          customer_data: customerData
        },
      },
    });

    console.log(`[DEBUG] Payment creado: ${payment.id}`);

    // Actualizar orden
    await prisma.$transaction(async (tx) => {
      console.log(`[DEBUG] Actualizando status y paymentId...`);
      // Actualizar status y paymentId
      await tx.productOrder.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paymentId: payment.id,
        },
      });

      // Actualizar campos del cliente con SQL raw
      if (customerData) {
        console.log(`[DEBUG] Actualizando campos del cliente...`);
        const name = customerData.name || null;
        const email = customerData.email || null;
        const phone = customerData.phone || null;
        const address = customerData.address || null;
        const city = customerData.city || null;

        await tx.$executeRawUnsafe(`
          UPDATE "ProductOrder" 
          SET 
            "customerName" = ${name ? `'${name.replace(/'/g, "''")}'` : 'NULL'},
            "customerEmail" = ${email ? `'${email.replace(/'/g, "''")}'` : 'NULL'},
            "shippingPhone" = ${phone ? `'${phone.replace(/'/g, "''")}'` : 'NULL'},
            "shippingAddress" = ${address ? `'${address.replace(/'/g, "''")}'` : 'NULL'},
            "shippingCity" = ${city ? `'${city.replace(/'/g, "''")}'` : 'NULL'}
          WHERE id = '${orderId}'
        `);
      }
    });

    // Actualizar stock
    if (productOrder.productId) {
      console.log(`[DEBUG] Actualizando stock...`);
      await prisma.producto.update({
        where: { id: productOrder.productId },
        data: {
          stock: {
            decrement: productOrder.quantity,
          },
        },
      });
    }

    console.log(`[DEBUG] ✅ Orden actualizada exitosamente`);

    return NextResponse.json({
      success: true,
      message: "Orden simulada exitosamente",
      orderId,
      paymentId: payment.id,
      customerData
    });

  } catch (error: any) {
    console.error(`[DEBUG] Error:`, error?.message || error);
    console.error(`[DEBUG] Stack:`, error?.stack);
    return NextResponse.json({
      error: error?.message || "Error desconocido",
      stack: error?.stack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Endpoint para simular callback de Bold",
    usage: {
      method: "POST",
      body: {
        orderId: "ID de la orden",
        transactionId: "ID de transacción",
        customerData: {
          name: "Nombre del cliente",
          email: "email@ejemplo.com",
          phone: "3001234567",
          address: "Calle 123 #45-67",
          city: "Bogotá"
        }
      }
    }
  });
}
