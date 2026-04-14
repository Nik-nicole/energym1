export class BoldService {
  static generateReference(prefix: string = 'ENRG'): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .substring(0, 60);
  }

  static async createPaymentLink(paymentData: {
    amount: number;
    currency: string;
    reference: string;
    description: string;
    callbackUrl: string;
    apiKey: string;
    imageUrl?: string;
    taxes?: Array<{
      type: string;
      base: number;
      value: number;
    }>;
  }) {
    const boldApiUrl = "https://integrations.api.bold.co/online/link/v1";
    
    const payload: any = {
      amount_type: "CLOSE",
      amount: {
        currency: paymentData.currency,
        total_amount: paymentData.amount,
        ...(paymentData.taxes && { taxes: paymentData.taxes }),
      },
      reference: paymentData.reference,
      description: paymentData.description,
      callback_url: paymentData.callbackUrl,
      ...(paymentData.imageUrl && { image_url: paymentData.imageUrl }),
    };

    console.log("[BoldService] Creando link de pago con payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(boldApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `x-api-key ${paymentData.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("[BoldService] Respuesta de Bold:", response.status, JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(`Error en Bold API: ${JSON.stringify(data)}`);
    }

    const paymentUrl = data.payload?.url || data.url || data.payment_link;
    
    if (!paymentUrl) {
      throw new Error(`No se encontró URL de pago en respuesta: ${JSON.stringify(data)}`);
    }

    return {
      success: true,
      paymentUrl,
      transactionId: paymentData.reference,
      reference: paymentData.reference,
      message: 'Link de pago generado exitosamente',
      data
    };
  }
}
