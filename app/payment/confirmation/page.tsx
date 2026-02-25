"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2, ShoppingBag, Crown, ArrowLeft, Home } from 'lucide-react'

interface PaymentConfirmationData {
  success: boolean
  type: 'product' | 'plan'
  orderDetails: {
    id: string
    name: string
    price: number
    quantity?: number
    status: string
    createdAt: string
  }
  paymentDetails: {
    transactionId: string
    method: string
    amount: number
    status: string
  }
  message: string
}

export default function PaymentConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<PaymentConfirmationData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const transactionId = searchParams.get('transaction_id')
    const type = searchParams.get('type') as 'product' | 'plan'

    if (!transactionId || !type) {
      setError('Información de pago incompleta')
      setLoading(false)
      return
    }

    // Simular obtención de datos del pago
    // En una implementación real, esto vendría de una API
    setTimeout(() => {
      setPaymentData({
        success: true,
        type,
        orderDetails: {
          id: `ORD_${Date.now()}`,
          name: type === 'product' ? 'Producto Ejemplo' : 'Plan Premium',
          price: parseFloat(searchParams.get('amount') || '0'),
          quantity: type === 'product' ? parseInt(searchParams.get('quantity') || '1') : 1,
          status: 'PAID',
          createdAt: new Date().toISOString()
        },
        paymentDetails: {
          transactionId,
          method: searchParams.get('method') || 'card',
          amount: parseFloat(searchParams.get('amount') || '0'),
          status: 'COMPLETED'
        },
        message: 'Pago procesado exitosamente'
      })
      setLoading(false)
    }, 2000)
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#D604E0] animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">Procesando tu pago...</h2>
          <p className="text-gray-400">Estamos verificando el estado de tu transacción</p>
        </div>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-white">Error en el pago</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-400">{error || 'Ocurrió un error al procesar tu pago'}</p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.back()} 
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <Button 
                onClick={() => router.push('/tienda')} 
                className="w-full bg-gradient-to-r from-[#D604E0] to-[#040AE0]"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir a la Tienda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center pb-6">
          {paymentData.success ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          <CardTitle className="text-2xl text-white mb-2">
            {paymentData.success ? '¡Pago Exitoso!' : 'Pago Fallido'}
          </CardTitle>
          <p className="text-gray-400">{paymentData.message}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Detalles de la orden */}
          <div className="bg-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              {paymentData.type === 'product' ? (
                <ShoppingBag className="w-5 h-5 text-[#D604E0]" />
              ) : (
                <Crown className="w-5 h-5 text-[#D604E0]" />
              )}
              <h3 className="text-lg font-semibold text-white">
                {paymentData.type === 'product' ? 'Detalles del Producto' : 'Detalles del Plan'}
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">ID de Orden:</span>
                <span className="text-white font-mono text-sm">{paymentData.orderDetails.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nombre:</span>
                <span className="text-white">{paymentData.orderDetails.name}</span>
              </div>
              {paymentData.type === 'product' && paymentData.orderDetails.quantity && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Cantidad:</span>
                  <span className="text-white">{paymentData.orderDetails.quantity}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Precio Unitario:</span>
                <span className="text-white">${paymentData.orderDetails.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total:</span>
                <span className="text-green-400 font-semibold text-lg">
                  ${paymentData.paymentDetails.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Estado:</span>
                <Badge className={
                  paymentData.orderDetails.status === 'PAID' 
                    ? 'bg-green-500/20 text-green-400 border-green-500/40'
                    : 'bg-red-500/20 text-red-400 border-red-500/40'
                }>
                  {paymentData.orderDetails.status === 'PAID' ? 'Pagado' : 'Fallido'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Detalles del pago */}
          <div className="bg-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Información del Pago</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">ID de Transacción:</span>
                <span className="text-white font-mono text-sm">{paymentData.paymentDetails.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Método de Pago:</span>
                <span className="text-white">
                  {paymentData.paymentDetails.method === 'card' ? 'Tarjeta de Crédito/Débito' : 'PSE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha:</span>
                <span className="text-white">
                  {new Date(paymentData.orderDetails.createdAt).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Mensaje de éxito */}
          {paymentData.success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 text-sm text-center">
                {paymentData.type === 'product' 
                  ? 'Tu orden ha sido creada exitosamente. Recibirás un email con los detalles de tu compra y el seguimiento del envío.'
                  : 'Tu plan ha sido activado exitosamente. Ya puedes disfrutar de todos los beneficios.'
                }
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-4 pt-4">
            <Button 
              onClick={() => router.push('/perfil')} 
              variant="outline" 
              className="flex-1 border-[#333] bg-[#1F1F1F] text-gray-300 hover:bg-[#262626]"
            >
              Ver Mi Perfil
            </Button>
            <Button 
              onClick={() => router.push('/tienda')} 
              className="flex-1 bg-gradient-to-r from-[#D604E0] to-[#040AE0] hover:opacity-90"
            >
              Seguir Comprando
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
