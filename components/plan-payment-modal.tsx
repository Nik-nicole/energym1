"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Shield, Loader2, Crown, Check, Star, Zap } from "lucide-react"

interface Plan {
  id: string
  nombre: string
  precio: number
  descripcion: string
  beneficios: string[]
  duracion: string
  tipo: string
  esVip: boolean
}

interface Sede {
  id: string
  nombre: string
  direccion: string
  ciudad: string
  telefono: string
  paymentGateway?: {
    cuentaBanco: string
  }
}

interface PlanPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: Plan
  selectedSede: Sede
}

export function PlanPaymentModal({ 
  open, 
  onOpenChange, 
  plan, 
  selectedSede 
}: PlanPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    // Datos de tarjeta
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvc: "",
    
    // Datos personales
    email: "",
    documentType: "CC",
    documentNumber: "",
    phone: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4)
    }
    return v
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Simulación de procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Crear la orden del plan
      const orderData = {
        planId: plan.id,
        sedeId: selectedSede.id,
        quantity: 1,
        unitPrice: plan.precio,
        totalPrice: plan.precio,
        paymentInfo: {
          method: paymentMethod,
          cardName: formData.cardName,
          last4Digits: formData.cardNumber.slice(-4),
          documentType: formData.documentType,
          documentNumber: formData.documentNumber,
          email: formData.email,
          phone: formData.phone
        }
      }

      const response = await fetch('/api/orders/plan/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (result.success) {
        setShowConfirmation(true)
        setTimeout(() => {
          onOpenChange(false)
          setShowConfirmation(false)
          // Reset form
          setFormData({
            cardNumber: "",
            cardName: "",
            cardExpiry: "",
            cardCvc: "",
            email: "",
            documentType: "CC",
            documentNumber: "",
            phone: ""
          })
          setPaymentMethod("")
        }, 5000)
      } else {
        throw new Error(result.error || 'Error al procesar el pago')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Error al procesar el pago. Por favor intenta nuevamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (showConfirmation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] bg-[#1A1A1A] border-[#2A2A2A]">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl font-semibold text-white mb-2">
              ¡Bienvenido a {plan.nombre}!
            </DialogTitle>
            <p className="text-gray-400 mb-6">
              Tu pago ha sido procesado exitosamente. Tu plan estará activo inmediatamente y podrás disfrutar de todos los beneficios.
            </p>
            <div className="bg-[#0A0A0A] rounded-lg p-4 text-left">
              <h4 className="text-white font-medium mb-2">Resumen de la compra:</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-400">Plan: <span className="text-white">{plan.nombre}</span></p>
                <p className="text-gray-400">Duración: <span className="text-white">{plan.duracion}</span></p>
                <p className="text-gray-400">Total: <span className="text-green-400 font-medium">${plan.precio.toFixed(2)}</span></p>
                <p className="text-gray-400">Método de pago: <span className="text-white">{paymentMethod === 'card' ? 'Tarjeta' : 'PSE'}</span></p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-[#1A1A1A] border-[#2A2A2A] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
            <Crown className="w-6 h-6 text-[#D604E0]" />
            Activar Plan - {plan.nombre}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Resumen del plan */}
          <div className="bg-gradient-to-r from-[#D604E0]/10 to-[#040AE0]/10 rounded-lg p-6 border border-[#D604E0]/30">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D604E0]/20 to-[#040AE0]/20 flex items-center justify-center">
                {plan.esVip ? (
                  <Crown className="w-8 h-8 text-[#D604E0]" />
                ) : (
                  <Zap className="w-8 h-8 text-[#040AE0]" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-medium text-lg">{plan.nombre}</h3>
                  {plan.esVip && <Badge className="bg-gradient-to-r from-[#D604E0] to-[#040AE0] text-white">VIP</Badge>}
                </div>
                <p className="text-gray-400 text-sm mb-3">{plan.descripcion}</p>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-gray-400 text-sm">Duración: {plan.duracion}</span>
                  <span className="text-gray-400 text-sm">Tipo: {plan.tipo}</span>
                </div>
                
                {/* Beneficios */}
                <div className="space-y-2">
                  <h4 className="text-white font-medium text-sm mb-2">Beneficios incluidos:</h4>
                  <div className="space-y-1">
                    {plan.beneficios.map((beneficio, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-3 h-3 text-green-400" />
                        <span className="text-gray-300">{beneficio}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#D604E0]">${plan.precio.toFixed(2)}</p>
                <p className="text-gray-400 text-sm">único pago</p>
              </div>
            </div>
          </div>

          {/* Información de la sede */}
          <div className="bg-[#0A0A0A] rounded-lg p-4 border border-[#2A2A2A]">
            <h4 className="text-white font-medium mb-3">Sede de Compra</h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-400">{selectedSede.nombre}</p>
              <p className="text-gray-400">{selectedSede.direccion}, {selectedSede.ciudad}</p>
              <p className="text-gray-400">Tel: {selectedSede.telefono}</p>
              {selectedSede.paymentGateway && (
                <p className="text-gray-400">Cuenta destino: {selectedSede.paymentGateway.cuentaBanco}</p>
              )}
            </div>
          </div>

          {/* Método de pago */}
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#D604E0]" />
              Método de Pago
            </h4>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
              <SelectTrigger className="bg-[#0A0A0A] border-[#2A2A2A] text-white">
                <SelectValue placeholder="Selecciona un método de pago" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A0A] border-[#2A2A2A]">
                <SelectItem value="card" className="text-white">Tarjeta de Crédito/Débito</SelectItem>
                <SelectItem value="pse" className="text-white">PSE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Información de pago */}
          {paymentMethod && (
            <div className="space-y-4 bg-[#0A0A0A] rounded-lg p-4 border border-[#2A2A2A]">
              <h4 className="text-white font-medium">Información de Pago</h4>
              
              {paymentMethod === 'card' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber" className="text-gray-300">Número de Tarjeta *</Label>
                    <Input
                      id="cardNumber"
                      value={formatCardNumber(formData.cardNumber)}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                      className="bg-[#1A1A1A] border-[#2A2A2A] text-white"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardName" className="text-gray-300">Nombre del Titular *</Label>
                    <Input
                      id="cardName"
                      value={formData.cardName}
                      onChange={(e) => handleInputChange('cardName', e.target.value)}
                      className="bg-[#1A1A1A] border-[#2A2A2A] text-white"
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cardExpiry" className="text-gray-300">Vencimiento *</Label>
                      <Input
                        id="cardExpiry"
                        value={formatExpiry(formData.cardExpiry)}
                        onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                        className="bg-[#1A1A1A] border-[#2A2A2A] text-white"
                        placeholder="MM/AA"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardCvc" className="text-gray-300">CVC *</Label>
                      <Input
                        id="cardCvc"
                        value={formData.cardCvc}
                        onChange={(e) => handleInputChange('cardCvc', e.target.value)}
                        className="bg-[#1A1A1A] border-[#2A2A2A] text-white"
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4">
                    <p className="text-blue-400 text-sm">
                      Serás redirigido a la página de tu banco para completar el pago con PSE.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="documentType" className="text-gray-300">Tipo de Documento *</Label>
                    <Select value={formData.documentType} onValueChange={(value) => handleInputChange('documentType', value)}>
                      <SelectTrigger className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">
                        <SelectItem value="CC" className="text-white">Cédula de Ciudadanía</SelectItem>
                        <SelectItem value="CE" className="text-white">Cédula de Extranjería</SelectItem>
                        <SelectItem value="NIT" className="text-white">NIT</SelectItem>
                        <SelectItem value="PP" className="text-white">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="documentNumber" className="text-gray-300">Número de Documento *</Label>
                    <Input
                      id="documentNumber"
                      value={formData.documentNumber}
                      onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                      className="bg-[#1A1A1A] border-[#2A2A2A] text-white"
                      placeholder="123456789"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Información personal */}
          <div className="space-y-4">
            <h4 className="text-white font-medium">Información de Contacto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-gray-300">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-gray-300">Teléfono *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
                  placeholder="3001234567"
                  required
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-[#333] bg-[#1F1F1F] text-gray-300 hover:bg-[#262626]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!paymentMethod || isProcessing}
              className="flex-1 bg-gradient-to-r from-[#D604E0] to-[#040AE0] hover:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando Pago...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Activar Plan - ${plan.precio.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
