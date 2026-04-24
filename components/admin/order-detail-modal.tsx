"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ShoppingBag,
  User,
  Calendar,
  MapPin,
  Package,
  CreditCard,
  Truck,
  Save,
  Pencil,
  CircleDot,
  X,
  Clock,
} from "lucide-react"
import Box from '@mui/material/Box'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import StepIcon from '@mui/material/StepIcon'

type OrderStatus =
  | "Pendiente"
  | "Orden Pagada"
  | "Verificada"
  | "Empacada"
  | "Enviada"
  | "Entregada"
  | "Cancelada"
  | "Rechazada"

interface OrderDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  onOrderUpdated?: () => void
}

interface TimelineItem {
  label: string
  status: "completed" | "current" | "pending"
  date: string
}

interface OrderData {
  id: string
  date: string
  total: string
  status: OrderStatus
  timeline: TimelineItem[]
  client: {
    name: string
    email: string
    phone: string
    address?: string
    city?: string
  }
  product: {
    name: string
    description: string
    category: string
    image: string
    quantity: number
    unitPrice: string
    subtotal: string
    total: string
    items?: {
      name: string
      description: string
      category: string
      image: string
      quantity: number
      unitPrice: string
      subtotal: string
      total: string
    }[]
  }
  location: {
    name: string
    address: string
    city: string
    phone: string
    email: string
    paymentAccount?: string
  }
  payment?: {
    method: string
    status: string
    amount: string
    date: string
    transactionId: string
  }
  shipping: {
    method: string
    trackingNumber: string
    notes: string
  }
}

const statusBadgeColors: Record<OrderStatus, string> = {
  Pendiente: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  "Orden Pagada": "bg-green-500/20 text-green-400 border-green-500/40",
  Verificada: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  Empacada: "bg-blue-400/20 text-blue-300 border-blue-400/40",
  Enviada: "bg-[#040AE0]/20 text-[#7A7DFF] border-[#040AE0]/40",
  Entregada: "bg-green-500/20 text-green-400 border-green-500/40",
  Cancelada: "bg-red-500/20 text-red-400 border-red-500/40",
  Rechazada: "bg-red-500/20 text-red-500 border-red-500/50 font-bold",
}

function SectionCard({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[#262626] bg-[#1F1F1F] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg flex items-center justify-center bg-gradient-to-r from-[#D604E0]/20 to-[#040AE0]/20">
            <Icon className="size-4 text-[#D604E0]" />
          </div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            {title}
          </h3>
        </div>
        {action}
      </div>

      <div className="border-t border-[#2A2A2A] pt-4">
        {children}
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  highlight,
  mono,
}: {
  label: string
  value: string
  highlight?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span
        className={`text-sm ${
          highlight ? "font-semibold text-[#D604E0]" : "text-white"
        } ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  )
}

export function OrderDetailModal({
  open,
  onOpenChange,
  orderId,
  onOrderUpdated,
}: OrderDetailModalProps) {
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("Orden Pagada")
  const [shippingMethod, setShippingMethod] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [shippingNotes, setShippingNotes] = useState("")

  useEffect(() => {
    if (open && orderId) {
      fetchOrder()
    }
  }, [open, orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/product/${orderId}`)
      const data = await response.json()
      
      if (data.success) {
        setOrder(data.order)
        setCurrentStatus(data.order.status)
        setShippingMethod(data.order.shipping.method)
        setTrackingNumber(data.order.shipping.trackingNumber)
        setShippingNotes(data.order.shipping.notes)
      } else {
        console.error("Error loading order:", data.error)
      }
    } catch (error) {
      console.error("Error fetching order:", error)
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener los estados permitidos según el estado actual
  const getAllowedStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    if (currentStatus === "Rechazada") {
      return ["Rechazada"];
    }
    return ["Pendiente", "Orden Pagada", "Verificada", "Empacada", "Enviada", "Entregada", "Cancelada"];
  }

  const handleSave = async () => {
    if (!order) {
      return
    }

    try {
      setSaving(true)
      
      // Convertir el status al formato de la base de datos
      const statusMapping: Record<OrderStatus, string> = {
        "Pendiente": "PENDING",
        "Orden Pagada": "PAID",
        "Verificada": "VERIFIED", 
        "Empacada": "PACKED",
        "Enviada": "SHIPPED",
        "Entregada": "DELIVERED",
        "Cancelada": "CANCELLED",
        "Rechazada": "CANCELLED"
      }

      const dbStatus = statusMapping[currentStatus] || "PENDING"
      const requestBody = {
        status: dbStatus
      }
      const response = await fetch(`/api/orders/product/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setIsEditing(false)
        fetchOrder() // Recargar datos
        
        // Notificar al componente padre que se actualizó la orden
        if (onOrderUpdated) {
          onOrderUpdated()
        }
        
        // Opcional: Mostrar notificación de éxito
        if (typeof window !== 'undefined' && 'toast' in window) {
          // @ts-ignore
          window.toast.success('Orden actualizada correctamente')
        }
      } else {
        console.error("Error updating order:", data.error)
        // Opcional: Mostrar notificación de error
        if (typeof window !== 'undefined' && 'toast' in window) {
          // @ts-ignore
          window.toast.error(data.error || 'Error al actualizar la orden')
        }
      }
    } catch (error) {
      console.error("Error updating order:", error)
      // Opcional: Mostrar notificación de error
      if (typeof window !== 'undefined' && 'toast' in window) {
        // @ts-ignore
        window.toast.error(error instanceof Error ? error.message : 'Error al actualizar la orden')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (order) {
      setCurrentStatus(order.status)
      setShippingMethod(order.shipping.method)
      setTrackingNumber(order.shipping.trackingNumber)
      setShippingNotes(order.shipping.notes)
    }
    setIsEditing(false)
  }

  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[900px] p-0 gap-0 border-[#2A2A2A] bg-[#1A1A1A]">
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-white">Cargando...</div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!order) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[900px] p-0 gap-0 border-[#2A2A2A] bg-[#1A1A1A]">
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-white">Orden no encontrada</div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[900px] p-0 bg-[#141414] border-l border-[#262626] [&>button:last-child]:hidden"
      >
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">
              Detalles de la Orden
            </h2>
            <Badge
              className={`${statusBadgeColors[currentStatus]} text-xs border`}
            >
              {currentStatus}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {currentStatus !== "Rechazada" && (
              isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                    className="border-[#333] bg-[#1F1F1F] text-gray-300 hover:bg-[#262626]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-[#D604E0] to-[#040AE0] hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="size-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="size-4 mr-1" />
                        Guardar
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-[#D604E0] to-[#040AE0] hover:opacity-90"
                >
                  <Pencil className="size-4 mr-1" />
                  Editar
                </Button>
              )
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white hover:bg-[#1F1F1F] ml-4"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* BODY */}
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="px-8 py-6 flex flex-col gap-8">
            
            {/* ESTADO - OCUPA TODO EL ANCHO */}
            <SectionCard
              title="Estado"
              icon={Clock}
              action={
                currentStatus === "Rechazada" ? (
                  <div className="text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded-md border border-red-500/30 text-sm">
                    Pago Rechazado
                  </div>
                ) : isEditing && (
                  <Select
                    value={currentStatus}
                    onValueChange={(v) =>
                      setCurrentStatus(v as OrderStatus)
                    }
                  >
                    <SelectTrigger className="h-9 w-[150px] bg-[#1A1A1A] border-[#2A2A2A] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">
                      {getAllowedStatuses(currentStatus).map((status: string) => (
                        <SelectItem
                          key={status}
                          value={status}
                          className="text-white"
                        >
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }
            >
              {/* Stepper de Material UI personalizado */}
              <Box sx={{ width: '100%' }}>
                <Stepper 
                  activeStep={order.timeline?.findIndex((item: any) => item.status === "current") ?? 0} 
                  alternativeLabel
                  sx={{
                    '& .MuiStepIcon-root': {
                      color: '#2A2A2A',
                      '&.Mui-active': {
                        color: '#22C55E',
                      },
                      '&.Mui-completed': {
                        color: '#22C55E',
                      },
                    },
                    '& .MuiStepLabel-label': {
                      color: '#A0A0A0',
                      '&.Mui-active': {
                        color: '#22C55E',
                        fontWeight: 'bold',
                      },
                      '&.Mui-completed': {
                        color: 'white',
                      },
                    },
                    '& .MuiStepConnector-line': {
                      borderColor: '#2A2A2A',
                    },
                    '& .MuiStepConnector-active .MuiStepConnector-line': {
                      borderColor: '#22C55E',
                    },
                    '& .MuiStepConnector-completed .MuiStepConnector-line': {
                      borderColor: '#22C55E',
                    },
                  }}
                >
                  {order.timeline?.map((item: any, index: number) => (
                    <Step key={index} completed={item.status === "completed"}>
                      <StepLabel
                        StepIconComponent={item.status === "cancelled" ? () => (
                          <div style={{ color: '#EF4444' }}>
                            <X />
                          </div>
                        ) : undefined}
                        sx={{
                          '& .MuiStepLabel-label': {
                            color: item.status === "cancelled" ? '#EF4444' : '#A0A0A0',
                            '&.Mui-active': {
                              color: item.status === "cancelled" ? '#EF4444' : '#D604E0',
                              fontWeight: 'bold',
                            },
                            '&.Mui-completed': {
                              color: item.status === "cancelled" ? '#EF4444' : 'white',
                            },
                          },
                        }}
                      >
                        {item.label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </SectionCard>

            {/* DOS COLUMNAS ABAJO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* LEFT */}
            <div className="flex flex-col gap-6">

              <SectionCard title="Informacion del Pedido" icon={ShoppingBag}>
                <div className="flex flex-col gap-4">
                  {/* Order Info */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-[#D604E0] font-medium">Datos de la Orden</span>
                    <InfoRow label="ID" value={order.id} mono />
                    <InfoRow label="Fecha" value={order.date} />
                    <InfoRow label="Total" value={order.total} highlight />
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-[#2A2A2A]">
                    <span className="text-xs text-[#D604E0] font-medium">
                      {order.product.items && order.product.items.length > 1 ? `${order.product.items.length} Productos` : "Producto"}
                    </span>
                    
                    {/* Multiple products */}
                    {order.product.items && order.product.items.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {order.product.items.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 pb-3 border-b border-[#2A2A2A] last:border-0">
                            <div className="w-16 h-16 rounded-lg bg-[#0A0A0A] flex items-center justify-center shrink-0 overflow-hidden border border-[#2A2A2A]">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="size-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <span className="text-sm font-semibold text-white">{item.name}</span>
                              <span className="text-xs text-[#D604E0] font-medium">{item.category}</span>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-[#A0A0A0]">Cant: {item.quantity}</span>
                                <span className="text-xs text-white">{item.unitPrice} c/u</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-[#2A2A2A]">
                          <InfoRow label="Total Cantidad" value={String(order.product.quantity)} />
                          <InfoRow label="Subtotal" value={order.product.subtotal} />
                          <InfoRow label="Total" value={order.product.total} highlight />
                        </div>
                      </div>
                    ) : (
                      /* Single product fallback */
                      <>
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 size-16 rounded-lg bg-[#0A0A0A] flex items-center justify-center shrink-0 overflow-hidden border border-[#2A2A2A]">
                            <img
                              src={order.product.image}
                              alt={order.product.name}
                              className="size-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span className="text-sm font-semibold text-white">{order.product.name}</span>
                            <span className="text-xs text-[#D604E0] font-medium">{order.product.category}</span>
                            <span className="text-[11px] text-[#A0A0A0]">{order.product.description}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                          <InfoRow label="Cantidad" value={String(order.product.quantity)} />
                          <InfoRow label="Precio Unit." value={order.product.unitPrice} />
                          <InfoRow label="Subtotal" value={order.product.subtotal} />
                          <InfoRow label="Total" value={order.product.total} highlight />
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Payment Info */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-[#2A2A2A]">
                    <span className="text-xs text-[#D604E0] font-medium">Informacion de Pago</span>
                    <InfoRow label="Estado" value={order.payment?.status || "-"} />
                    <InfoRow label="Monto" value={order.payment?.amount || "-"} highlight />
                    <InfoRow label="Cuenta de Pago" value={order.location?.paymentAccount || "-"} highlight mono />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Cliente" icon={User}>
                <InfoRow label="Nombre" value={order.client.name} />
                <InfoRow label="Email" value={order.client.email} />
                <InfoRow label="Telefono" value={order.client.phone} />
                <InfoRow label="Direccion" value={order.client.address || "No especificada"} />
                <InfoRow label="Ciudad" value={order.client.city || "No especificada"} />
              </SectionCard>

            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-6">

              <SectionCard title="Sede y Direccion" icon={MapPin}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-[#D604E0] font-medium">Sede de Pago</span>
                    <InfoRow label="Sede" value={order.location.name} />
                    <InfoRow label="Ciudad" value={order.location.city} />
                    <InfoRow label="Telefono" value={order.location.phone} />
                    <InfoRow label="Cuenta Asociada" value={order.location?.paymentAccount || "-"} highlight mono />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-[#D604E0] font-medium">Direccion de Entrega</span>
                    <InfoRow label="Direccion" value={order.client?.address || "No especificada"} />
                    <InfoRow label="Ciudad" value={order.client?.city || "No especificada"} />
                    <InfoRow label="Telefono" value={order.client.phone} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Informacion de Envio" icon={Truck}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[#A0A0A0] font-medium">Entidad de Envío</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={shippingMethod}
                        onChange={(e) => setShippingMethod(e.target.value)}
                        placeholder="Ej: Servientrega, Coordinadora"
                        className="h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-sm text-white placeholder:text-[#A0A0A0] outline-none focus:ring-2 focus:ring-[#040AE0]/30 focus:border-[#040AE0]/50 transition-all"
                      />
                    ) : (
                      <div className="h-9 flex items-center px-3 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-sm text-white">
                        {shippingMethod || "Sin especificar"}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[#A0A0A0] font-medium">
                      Numero de Rastreo
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Ej: 1234567890"
                        className="h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-sm text-white placeholder:text-[#A0A0A0] outline-none focus:ring-2 focus:ring-[#040AE0]/30 focus:border-[#040AE0]/50 transition-all"
                      />
                    ) : (
                      <div className="h-9 flex items-center px-3 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-sm text-white font-mono">
                        {trackingNumber || "Sin asignar"}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[#A0A0A0] font-medium">Detalles del Envio</label>
                    {isEditing ? (
                      <textarea
                        value={shippingNotes}
                        onChange={(e) => setShippingNotes(e.target.value)}
                        placeholder="Notas adicionales sobre el envio..."
                        rows={3}
                        className="px-3 py-2 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-sm text-white placeholder:text-[#A0A0A0] outline-none focus:ring-2 focus:ring-[#040AE0]/30 focus:border-[#040AE0]/50 transition-all resize-none"
                      />
                    ) : (
                      <div className="min-h-[60px] px-3 py-2 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-sm text-[#A0A0A0]">
                        {shippingNotes || "Sin notas"}
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>

            </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
