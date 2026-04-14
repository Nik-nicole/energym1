// Script para probar directamente la API de Bold con el paymentLinkId
const paymentLinkId = "LNK_VDW3NK05JA"; // ID de tu pago

async function testBoldDirect() {
  try {
    console.log(`[Test Bold] Consultando estado para paymentLinkId: ${paymentLinkId}`);
    
    // Obtener API key (necesitarías configurarla)
    const boldApiKey = process.env.BOLD_API_KEY || "TU_API_KEY_AQUI";
    
    const boldApiUrl = `https://integrations.api.bold.co/online/link/v1/${paymentLinkId}`;
    
    console.log(`[Test Bold] URL: ${boldApiUrl}`);
    
    const response = await fetch(boldApiUrl, {
      method: "GET",
      headers: {
        "Authorization": `x-api-key ${boldApiKey}`,
        "Content-Type": "application/json"
      }
    });
    
    console.log(`[Test Bold] Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Test Bold] Error: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`[Test Bold] Respuesta:`, JSON.stringify(data, null, 2));
    
    // Extraer el estado
    const status = data.payload?.status || data.status;
    console.log(`[Test Bold] Estado del pago: ${status}`);
    
  } catch (error) {
    console.error(`[Test Bold] Error completo:`, error);
  }
}

testBoldDirect();
