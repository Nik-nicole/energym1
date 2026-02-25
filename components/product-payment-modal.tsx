"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Truck, MapPin, Phone, User, Mail, Shield, Loader2, ShoppingBag } from "lucide-react"

interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: number
  imagen?: string
  categoria: string
  stock: number
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

interface ProductPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Producto
  selectedSede: Sede
  quantity: number
}

export function ProductPaymentModal({ 
  open, 
  onOpenChange, 
  product, 
  selectedSede, 
  quantity 
}: ProductPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    // Dirección de envío
    direccion: "",
    ciudad: "",
    departamento: "",
    codigoPostal: "",
    telefono: "",
    indicaciones: "",
    
    // Datos de tarjeta
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvc: "",
    
    // Datos personales
    email: "",
    documentType: "CC",
    documentNumber: ""
  })

  const total = product.precio * quantity

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
      // Simulación de procesamiento de pago con Wompi
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Crear la orden
      const orderData = {
        productId: product.id,
        sedeId: selectedSede.id,
        quantity,
        unitPrice: product.precio,
        totalPrice: total,
        shippingAddress: {
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          departamento: formData.departamento,
          codigoPostal: formData.codigoPostal,
          telefono: formData.telefono,
          indicaciones: formData.indicaciones
        },
        paymentInfo: {
          method: paymentMethod,
          cardName: formData.cardName,
          last4Digits: formData.cardNumber.slice(-4),
          documentType: formData.documentType,
          documentNumber: formData.documentNumber
        }
      }

      const response = await fetch('/api/orders/product/create', {
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
            direccion: "",
            ciudad: "",
            departamento: "",
            codigoPostal: "",
            telefono: "",
            indicaciones: "",
            cardNumber: "",
            cardName: "",
            cardExpiry: "",
            cardCvc: "",
            email: "",
            documentType: "CC",
            documentNumber: ""
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
              <Shield className="w-8 h-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl font-semibold text-white mb-2">
              ¡Pago Procesado Exitosamente!
            </DialogTitle>
            <p className="text-gray-400 mb-6">
              Tu orden ha sido creada y está siendo procesada. Recibirás un email con los detalles de tu compra.
            </p>
            <div className="bg-[#0A0A0A] rounded-lg p-4 text-left">
              <h4 className="text-white font-medium mb-2">Resumen de la orden:</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-400">Producto: <span className="text-white">{product.nombre}</span></p>
                <p className="text-gray-400">Cantidad: <span className="text-white">{quantity}</span></p>
                <p className="text-gray-400">Total: <span className="text-green-400 font-medium">${total.toFixed(2)}</span></p>
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
      <DialogContent className="sm:max-w-[800px] bg-[#1A1A1A] border-[#2A2A2A] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-[#D604E0]" />
            Procesar Pago - {product.nombre}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Resumen del producto */}
          <div className="bg-[#0A0A0A] rounded-lg p-4 border border-[#2A2A2A]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-[#1F1F1F] flex items-center justify-center overflow-hidden">
                {product.imagen ? (
                  <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#D604E0]/20 to-[#040AE0]/20 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-[#D604E0]" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">{product.nombre}</h3>
                <p className="text-gray-400 text-sm">{product.descripcion}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary">{product.categoria}</Badge>
                  <span className="text-gray-400 text-sm">Cantidad: {quantity}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#D604E0]">${total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Información de la sede */}
          <div className="bg-[#0A0A0A] rounded-lg p-4 border border-[#2A2A2A]">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D604E0]" />
              Sede de Compra
            </h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-400">{selectedSede.nombre}</p>
              <p className="text-gray-400">{selectedSede.direccion}, {selectedSede.ciudad}</p>
              <p className="text-gray-400">Tel: {selectedSede.telefono}</p>
              {selectedSede.paymentGateway && (
                <p className="text-gray-400">Cuenta destino: {selectedSede.paymentGateway.cuentaBanco}</p>
              )}
            </div>
          </div>

          {/* Dirección de envío */}
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#D604E0]" />
              Dirección de Envío
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="direccion" className="text-gray-300">Dirección *</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
                  placeholder="Calle 123 #45-67"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ciudad" className="text-gray-300">Ciudad *</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => handleInputChange('ciudad', e.target.value)}
                  className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
                  placeholder="Bogotá"
                  required
                />
              </div>
              <div>
                <Label htmlFor="departamento" className="text-gray-300">Departamento *</Label>
                <Input
                  id="departamento"
                  value={formData.departamento}
                  onChange={(e) => handleInputChange('departamento', e.target.value)}
                  className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
                  placeholder="Cundinamarca"
                  required
                />
              </div>
              <div>
                <Label htmlFor="telefono" className="text-gray-300">Teléfono de Contacto *</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
                  placeholder="3001234567"
                  required
                />
              </div>
              <div>
                <Label htmlFor="codigoPostal" className="text-gray-300">Código Postal</Label>
                <Input
                  id="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={(e) => handleInputChange('codigoPostal', e.target.value)}
                  className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
                  placeholder="110111"
                />
              </div>
              <div>
                <Label htmlFor="indicaciones" className="text-gray-300">Indicaciones Adicionales</Label>
                <Input
                  id="indicaciones"
                  value={formData.indicaciones}
                  onChange={(e) => handleInputChange('indicaciones', e.target.value)}
                  className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
                  placeholder="Apartamento 201, conjunto cerrado"
                />
              </div>
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
            <h4 className="text-white font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-[#D604E0]" />
              Información de Contacto
            </h4>
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
                  Pagar ${total.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
