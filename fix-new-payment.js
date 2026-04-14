// Script para actualizar el nuevo pago que tiene la referencia incorrecta
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNewPayment() {
  try {
    console.log("[Fix] Buscando pago con referencia interna...");
    
    // Buscar el pago que tiene la referencia interna
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: "ORD-cmm2734i-1775671453255-745"
      },
      include: {
        sede: {
          include: {
            paymentGateway: true
          }
        }
      }
    });
    
    if (!payment) {
      console.log("[Fix] No se encontró el pago con esa referencia");
      return;
    }
    
    console.log("[Fix] Pago encontrado:", {
      id: payment.id,
      currentTransactionId: payment.transactionId,
      status: payment.status,
      amount: payment.amount
    });
    
    // Consultar la respuesta de Bold para obtener el paymentLinkId
    const gatewayResponse = payment.gatewayResponse;
    console.log("[Fix] Respuesta de Bold guardada:", JSON.stringify(gatewayResponse, null, 2));
    
    if (gatewayResponse && gatewayResponse.payload && gatewayResponse.payload.payment_link) {
      const paymentLinkId = gatewayResponse.payload.payment_link;
      console.log(`[Fix] PaymentLinkId encontrado: ${paymentLinkId}`);
      
      // Actualizar el pago con el paymentLinkId correcto
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: paymentLinkId
        }
      });
      
      console.log("[Fix] Pago actualizado:", {
        id: updatedPayment.id,
        newTransactionId: updatedPayment.transactionId,
        status: updatedPayment.status
      });
      
      console.log("[Fix] ¡Listo! Ahora el sistema usará el paymentLinkId correcto");
    } else {
      console.log("[Fix] No se encontró payment_link en la respuesta de Bold");
      console.log("[Fix] Probemos con el paymentLinkId que ya conocemos...");
      
      // Usar el paymentLinkId que ya sabemos que funciona
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: "LNK_VDW3NK05JA"
        }
      });
      
      console.log("[Fix] Pago actualizado con LNK_VDW3NK05JA:", {
        id: updatedPayment.id,
        newTransactionId: updatedPayment.transactionId
      });
    }
    
  } catch (error) {
    console.error("[Fix] Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNewPayment();
