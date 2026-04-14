// Script para probar el estado del pago usando el nuevo sistema
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPaymentStatus() {
  try {
    console.log("[Test] Buscando pago con paymentLinkId...");
    
    // Obtener el pago actualizado
    const payment = await prisma.payment.findUnique({
      where: { id: 'cmnqc7l000005udh8bubm1j7j' },
      include: {
        sede: {
          include: {
            paymentGateway: true
          }
        }
      }
    });
    
    if (!payment) {
      console.log("[Test] No se encontró el pago");
      return;
    }
    
    console.log("[Test] Pago encontrado:", {
      id: payment.id,
      transactionId: payment.transactionId, // Ahora es LNK_VDW3NK05JA
      status: payment.status,
      amount: payment.amount
    });
    
    // Obtener la API key
    const envVarName = payment.sede?.paymentGateway?.cuentaBanco;
    const boldApiKey = envVarName ? process.env[envVarName] : null;
    
    console.log("[Test] Variable de entorno:", envVarName);
    console.log("[Test] API Key encontrada:", boldApiKey ? "Sí" : "No");
    
    if (!boldApiKey) {
      console.log("[Test] No se encontró API key. Configura la variable de entorno");
      return;
    }
    
    // Consultar estado a Bold
    console.log(`[Test] Consultando estado a Bold para paymentLinkId: ${payment.transactionId}`);
    
    const boldApiUrl = `https://integrations.api.bold.co/online/link/v1/${payment.transactionId}`;
    
    const response = await fetch(boldApiUrl, {
      method: "GET",
      headers: {
        "Authorization": `x-api-key ${boldApiKey}`,
        "Content-Type": "application/json"
      }
    });
    
    console.log(`[Test] Respuesta Bold: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Test] Error de Bold: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`[Test] Datos de Bold:`, JSON.stringify(data, null, 2));
    
    // Extraer estado
    const boldStatus = data.payload?.status || data.status;
    console.log(`[Test] Estado según Bold: ${boldStatus}`);
    
    // Mapear estado de Bold a nuestro sistema
    let mappedStatus = 'PENDING';
    switch (boldStatus?.toUpperCase()) {
      case 'APPROVED':
      case 'PAID':
        mappedStatus = 'PAID';
        break;
      case 'REJECTED':
        mappedStatus = 'REJECTED';
        break;
      case 'EXPIRED':
        mappedStatus = 'EXPIRED';
        break;
      case 'CANCELLED':
        mappedStatus = 'CANCELLED';
        break;
      default:
        mappedStatus = 'PENDING';
    }
    
    console.log(`[Test] Estado mapeado: ${mappedStatus}`);
    
    // Actualizar en la base de datos si es diferente
    if (mappedStatus !== payment.status) {
      console.log(`[Test] Actualizando estado de ${payment.status} a ${mappedStatus}`);
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: mappedStatus }
      });
      
      // También actualizar la orden
      await prisma.productOrder.updateMany({
        where: { paymentId: payment.id },
        data: { status: mappedStatus }
      });
      
      console.log("[Test] ¡Estado actualizado en la base de datos!");
    } else {
      console.log("[Test] El estado ya está actualizado");
    }
    
  } catch (error) {
    console.error("[Test] Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentStatus();
