// Script para limpiar el pago duplicado y mantener solo el correcto
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicatePayment() {
  try {
    console.log("[Cleanup] Analizando pagos duplicados...");
    
    // Buscar el pago con referencia interna (el incorrecto)
    const wrongPayment = await prisma.payment.findFirst({
      where: {
        transactionId: "ORD-cmm2734i-1775671453255-745"
      },
      include: {
        productOrders: true
      }
    });
    
    if (!wrongPayment) {
      console.log("[Cleanup] No se encontró el pago incorrecto");
      return;
    }
    
    console.log("[Cleanup] Pago incorrecto encontrado:", {
      id: wrongPayment.id,
      transactionId: wrongPayment.transactionId,
      status: wrongPayment.status,
      amount: wrongPayment.amount,
      productOrdersCount: wrongPayment.productOrders.length
    });
    
    // Buscar el pago correcto (con paymentLinkId)
    const correctPayment = await prisma.payment.findFirst({
      where: {
        transactionId: "LNK_VDW3NK05JA"
      },
      include: {
        productOrders: true
      }
    });
    
    if (!correctPayment) {
      console.log("[Cleanup] No se encontró el pago correcto");
      return;
    }
    
    console.log("[Cleanup] Pago correcto encontrado:", {
      id: correctPayment.id,
      transactionId: correctPayment.transactionId,
      status: correctPayment.status,
      amount: correctPayment.amount,
      productOrdersCount: correctPayment.productOrders.length
    });
    
    // Transferir las órdenes del pago incorrecto al pago correcto
    if (wrongPayment.productOrders.length > 0) {
      console.log(`[Cleanup] Transfiriendo ${wrongPayment.productOrders.length} órdenes al pago correcto...`);
      
      for (const order of wrongPayment.productOrders) {
        await prisma.productOrder.update({
          where: { id: order.id },
          data: { paymentId: correctPayment.id }
        });
        
        console.log(`[Cleanup] Orden ${order.id} transferida al pago correcto`);
      }
    }
    
    // Eliminar el pago incorrecto
    console.log("[Cleanup] Eliminando pago incorrecto...");
    await prisma.payment.delete({
      where: { id: wrongPayment.id }
    });
    
    console.log("[Cleanup] ¡Limpieza completada!");
    
    // Verificar el estado final
    const finalCorrectPayment = await prisma.payment.findUnique({
      where: { id: correctPayment.id },
      include: {
        productOrders: true
      }
    });
    
    console.log("[Cleanup] Estado final del pago correcto:", {
      id: finalCorrectPayment.id,
      transactionId: finalCorrectPayment.transactionId,
      status: finalCorrectPayment.status,
      productOrdersCount: finalCorrectPayment.productOrders.length
    });
    
  } catch (error) {
    console.error("[Cleanup] Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicatePayment();
