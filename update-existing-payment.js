// Script para actualizar el pago existente con el paymentLinkId de Bold
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateExistingPayment() {
  try {
    console.log("[Update] Buscando pago existente...");
    
    // Buscar el pago por el transactionId original (reference)
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: {
          startsWith: "ORD-cmm2734i-1775670233611-576"
        }
      }
    });
    
    if (!payment) {
      console.log("[Update] No se encontró el pago");
      return;
    }
    
    console.log("[Update] Pago encontrado:", {
      id: payment.id,
      currentTransactionId: payment.transactionId,
      status: payment.status,
      amount: payment.amount
    });
    
    // Actualizar con el paymentLinkId de Bold
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: "LNK_VDW3NK05JA" // El paymentLinkId de Bold
      }
    });
    
    console.log("[Update] Pago actualizado:", {
      id: updatedPayment.id,
      newTransactionId: updatedPayment.transactionId,
      status: updatedPayment.status
    });
    
    console.log("[Update] ¡Listo! Ahora el sistema usará LNK_VDW3NK05JA para consultar el estado");
    
  } catch (error) {
    console.error("[Update] Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingPayment();
