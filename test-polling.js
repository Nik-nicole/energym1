// Script para probar el polling del pago
const transactionId = "ORD-cmm2734i-1775670233611-576";

async function testPolling() {
  try {
    console.log(`[Test] Iniciando polling para transactionId: ${transactionId}`);
    
    const response = await fetch(`https://energym1-five.vercel.app/api/payments/status/${transactionId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`[Test] Respuesta del servidor:`, JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.error(`[Test] Error en la respuesta:`, data.error);
    } else {
      console.log(`[Test] Estado del pago: ${data.status}`);
      console.log(`[Test] Monto: ${data.amount}`);
      console.log(`[Test] Ignorado: ${data.ignored}`);
    }
    
  } catch (error) {
    console.error(`[Test] Error completo:`, error);
  }
}

testPolling();
