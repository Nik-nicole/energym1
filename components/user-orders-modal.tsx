"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingBag,
  Package,
  Truck,
  Clock,
  Calendar,
  X,
  Loader2,
} from "lucide-react"

interface UserOrder {
  id: string
  date: string
  total: string
  status: string
  productName: string
  productImage: string
  quantity: number
  trackingNumber: string
}

interface UserOrdersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusBadgeColors: Record<string, string> = {
  "Orden Pagada": "bg-green-500/20 text-green-400 border-green-500/40",
  "Verificada": "bg-blue-500/20 text-blue-400 border-blue-500/40",
  "Empacada": "bg-blue-400/20 text-blue-300 border-blue-400/40",
  "Enviada": "bg-[#040AE0]/20 text-[#7A7DFF] border-[#040AE0]/40",
  "Cancelada": "bg-red-500/20 text-red-400 border-red-500/40",
}

export function UserOrdersModal({ open, onOpenChange }: UserOrdersModalProps) {
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null)

  useEffect(() => {
    if (open) {
      fetchOrders()
    }
  }, [open])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders/user-orders')
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.orders)
      } else {
        console.error("Error loading orders:", data.error)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTrackOrder = (order: UserOrder) => {
    setSelectedOrder(order)
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] bg-[#1A1A1A] border-[#2A2A2A]">
          <div className="flex items-center justify-center h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#D604E0] animate-spin" />
              <p className="text-white">Cargando tus órdenes...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-[#1A1A1A] border-[#2A2A2A]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-[#D604E0]" />
            Mis Órdenes de Productos
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Revisa el estado de tus compras y rastrea tus productos
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No tienes órdenes aún</p>
              <p className="text-gray-500 text-sm">Cuando compres productos, aparecerán aquí</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-[#262626] bg-[#1F1F1F] p-5 hover:border-[#D604E0]/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-[#0A0A0A] flex items-center justify-center overflow-hidden border border-[#2A2A2A]">
                          <img
                            src={order.productImage}
                            alt={order.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{order.productName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-400 text-sm">{order.date}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 text-sm">Cantidad: {order.quantity}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold text-lg">{order.total}</p>
                        <Badge
                          className={`${statusBadgeColors[order.status]} text-xs border mt-1`}
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Truck className="w-4 h-4" />
                        <span>Rastreo: {order.trackingNumber}</span>
                      </div>
                      <Button
                        onClick={() => handleTrackOrder(order)}
                        className="bg-gradient-to-r from-[#D604E0] to-[#040AE0] hover:opacity-90 text-sm"
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="sm:max-w-[500px] bg-[#1A1A1A] border-[#2A2A2A]">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-white">
                  Detalles de la Orden
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg bg-[#0A0A0A] flex items-center justify-center overflow-hidden border border-[#2A2A2A]">
                    <img
                      src={selectedOrder.productImage}
                      alt={selectedOrder.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-lg">{selectedOrder.productName}</h3>
                    <p className="text-gray-400">ID: {selectedOrder.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Fecha</p>
                    <p className="text-white font-medium">{selectedOrder.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Cantidad</p>
                    <p className="text-white font-medium">{selectedOrder.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total</p>
                    <p className="text-white font-medium text-lg">{selectedOrder.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Estado</p>
                    <Badge
                      className={`${statusBadgeColors[selectedOrder.status]} text-xs border mt-1`}
                    >
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2A2A2A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-[#D604E0]" />
                    <p className="text-gray-400 text-sm">Número de Rastreo</p>
                  </div>
                  <p className="text-white font-mono bg-[#0A0A0A] px-3 py-2 rounded-md border border-[#2A2A2A]">
                    {selectedOrder.trackingNumber}
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setSelectedOrder(null)}
                    className="bg-gradient-to-r from-[#D604E0] to-[#040AE0] hover:opacity-90"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
