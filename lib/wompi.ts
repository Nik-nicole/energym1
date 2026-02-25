// Servicio de simulación de Wompi para procesar pagos

export interface WompiPaymentRequest {
  amount: number
  currency: string
  customerEmail: string
  paymentMethod: 'card' | 'pse'
  cardInfo?: {
    number: string
    name: string
    expiry: string
    cvc: string
  }
  pseInfo?: {
    documentType: string
    documentNumber: string
  }
  reference: string
}

export interface WompiPaymentResponse {
  success: boolean
  transactionId: string
  status: 'APPROVED' | 'DECLINED' | 'PENDING' | 'ERROR'
  message: string
  amount: number
  currency: string
  createdAt: string
}

export class WompiService {
  private static baseUrl = 'https://api.wompi.co' // URL real de Wompi
  private static isSimulation = true // Flag para simular

  /**
   * Procesa un pago a través de Wompi (simulado)
   */
  static async processPayment(request: WompiPaymentRequest): Promise<WompiPaymentResponse> {
    if (this.isSimulation) {
      return this.simulatePayment(request)
    }

    // Aquí iría la integración real con Wompi
    try {
      const response = await fetch(`${this.baseUrl}/v1/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`
        },
        body: JSON.stringify({
          amount_in_cents: Math.round(request.amount * 100),
          currency: request.currency,
          customer_email: request.customerEmail,
          payment_method: {
            type: request.paymentMethod === 'card' ? 'CARD' : 'PSE',
            ...(request.paymentMethod === 'card' && {
              card: {
                number: request.cardInfo?.number,
                cvc: request.cardInfo?.cvc,
                exp_month: request.cardInfo?.expiry.split('/')[0],
                exp_year: request.cardInfo?.expiry.split('/')[1],
                card_holder: request.cardInfo?.name
              }
            }),
            ...(request.paymentMethod === 'pse' && {
              pse: {
                type: request.pseInfo?.documentType,
                user_type: 'PERSON',
                user_legal_id_type: request.pseInfo?.documentType,
                user_legal_id: request.pseInfo?.documentNumber,
                financial_institution_code: '1022', // Código por defecto
                payment_description: 'Compra en Energym',
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/return`,
                reference: request.reference
              }
            })
          },
          acceptance_token: 'mock_acceptance_token'
        })
      })

      const data = await response.json()
      
      return {
        success: data.data?.status === 'APPROVED',
        transactionId: data.data?.id || '',
        status: data.data?.status || 'ERROR',
        message: data.data?.message || 'Error en el pago',
        amount: request.amount,
        currency: request.currency,
        createdAt: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        transactionId: '',
        status: 'ERROR',
        message: 'Error al conectar con Wompi',
        amount: request.amount,
        currency: request.currency,
        createdAt: new Date().toISOString()
      }
    }
  }

  /**
   * Simula un procesamiento de pago para desarrollo/pruebas
   */
  private static async simulatePayment(request: WompiPaymentRequest): Promise<WompiPaymentResponse> {
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))

    // Simular diferentes resultados basados en el número de tarjeta
    const isTestCard = request.cardInfo?.number?.startsWith('4242') || 
                      request.pseInfo?.documentNumber?.startsWith('12345')

    const success = isTestCard || Math.random() > 0.1 // 90% de éxito en simulación

    return {
      success,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: success ? 'APPROVED' : 'DECLINED',
      message: success ? 'Pago aprobado exitosamente' : 'Pago rechazado',
      amount: request.amount,
      currency: request.currency,
      createdAt: new Date().toISOString()
    }
  }

  /**
   * Verifica el estado de una transacción
   */
  static async checkTransactionStatus(transactionId: string): Promise<WompiPaymentResponse | null> {
    if (this.isSimulation) {
      // En simulación, siempre retornamos aprobado
      return {
        success: true,
        transactionId,
        status: 'APPROVED',
        message: 'Transacción aprobada',
        amount: 0,
        currency: 'COP',
        createdAt: new Date().toISOString()
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`
        }
      })

      const data = await response.json()
      
      return {
        success: data.data?.status === 'APPROVED',
        transactionId: data.data?.id || '',
        status: data.data?.status || 'ERROR',
        message: data.data?.message || 'Error verificando transacción',
        amount: data.data?.amount_in_cents ? data.data.amount_in_cents / 100 : 0,
        currency: data.data?.currency || 'COP',
        createdAt: data.data?.created_at || new Date().toISOString()
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Genera un reference ID único para cada transacción
   */
  static generateReference(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `energym_${timestamp}_${random}`
  }
}
