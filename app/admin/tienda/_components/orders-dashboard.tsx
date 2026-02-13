"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Filter,
  RefreshCw,
  User,
  Calendar,
  DollarSign,
  Eye,
  Trash2,
  X,
  MapPin,
  Phone,
  Mail
} from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    id: string;
    nombre: string;
    imagen?: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: OrderItem[];
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Pendiente de Proceso",
    color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    icon: Clock,
    nextStatus: "CONFIRMED",
    description: "Esperando procesamiento"
  },
  CONFIRMED: {
    label: "Confirmada",
    color: "bg-blue-500/20 text-blue-500 border-blue-500/30", 
    icon: Package,
    nextStatus: "SHIPPED",
    description: "Lista para enviar"
  },
  SHIPPED: {
    label: "Enviada",
    color: "bg-purple-500/20 text-purple-500 border-purple-500/30",
    icon: Truck,
    nextStatus: "DELIVERED",
    description: "En camino al cliente"
  },
  DELIVERED: {
    label: "Entregada",
    color: "bg-green-500/20 text-green-500 border-green-500/30",
    icon: CheckCircle,
    nextStatus: null,
    description: "Entregada con éxito"
  },
  CANCELLED: {
    label: "Cancelada",
    color: "bg-red-500/20 text-red-500 border-red-500/30",
    icon: XCircle,
    nextStatus: null,
    description: "Orden cancelada"
  }
};

const PAYMENT_STATUS_CONFIG = {
  PENDING: {
    label: "Pendiente",
    color: "bg-yellow-500/20 text-yellow-500"
  },
  PAID: {
    label: "Pagada", 
    color: "bg-green-500/20 text-green-500"
  },
  FAILED: {
    label: "Fallida",
    color: "bg-red-500/20 text-red-500"
  }
};

export function OrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/admin/orders?date=${today}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(orderId);
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setUpdating(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      setUpdating(orderId);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOrders(prev => prev.filter(order => order.id !== orderId));
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === "all") return true;
    if (filter === "paid") return order.paymentStatus === "PAID";
    return order.status === filter;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
  };

  const getPaymentStatusConfig = (status: string) => {
    return PAYMENT_STATUS_CONFIG[status as keyof typeof PAYMENT_STATUS_CONFIG] || PAYMENT_STATUS_CONFIG.PENDING;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-[#040AE0]" />
        <span className="ml-2 text-white">Cargando órdenes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Órdenes del Día</h2>
          <p className="text-gray-400">
            {new Date().toLocaleDateString('es-CO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <Button
          onClick={fetchOrders}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card className="bg-[#141414] border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Filtrar:</span>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-[#040AE0]" : "border-white/20 text-white hover:bg-white/10"}
              >
                Todas ({orders.length})
              </Button>
              <Button
                variant={filter === "PENDING" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("PENDING")}
                className={filter === "PENDING" ? "bg-[#040AE0]" : "border-white/20 text-white hover:bg-white/10"}
              >
                ⏰ Por Procesar ({orders.filter(o => o.status === "PENDING").length})
              </Button>
              <Button
                variant={filter === "CONFIRMED" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("CONFIRMED")}
                className={filter === "CONFIRMED" ? "bg-[#040AE0]" : "border-white/20 text-white hover:bg-white/10"}
              >
                📦 Listas para Enviar ({orders.filter(o => o.status === "CONFIRMED").length})
              </Button>
              <Button
                variant={filter === "SHIPPED" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("SHIPPED")}
                className={filter === "SHIPPED" ? "bg-[#040AE0]" : "border-white/20 text-white hover:bg-white/10"}
              >
                🚚 Enviadas ({orders.filter(o => o.status === "SHIPPED").length})
              </Button>
              <Button
                variant={filter === "DELIVERED" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("DELIVERED")}
                className={filter === "DELIVERED" ? "bg-[#040AE0]" : "border-white/20 text-white hover:bg-white/10"}
              >
                ✅ Entregadas ({orders.filter(o => o.status === "DELIVERED").length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#141414] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Órdenes Pagadas</p>
                <p className="text-xl font-bold text-white">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#141414] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Por Procesar</p>
                <p className="text-xl font-bold text-white">
                  {orders.filter(o => o.status === "PENDING").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Truck className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Enviadas</p>
                <p className="text-xl font-bold text-white">
                  {orders.filter(o => o.status === "SHIPPED").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Entregadas</p>
                <p className="text-xl font-bold text-white">
                  {orders.filter(o => o.status === "DELIVERED").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Órdenes */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="bg-[#141414] border-white/10">
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No hay órdenes {filter !== "all" && `con estado "${getStatusConfig(filter).label.toLowerCase()}"`}
              </h3>
              <p className="text-gray-400">
                {filter === "all" 
                  ? "No se han registrado órdenes hoy" 
                  : "No hay órdenes con este filtro"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const paymentConfig = getPaymentStatusConfig(order.paymentStatus);
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414] border border-white/10 rounded-lg overflow-hidden"
              >
                <div className="p-6">
                  {/* Header de la orden */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{order.orderNumber}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.createdAt).toLocaleString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-500">
                        💳 Pagada
                      </Badge>
                      <Badge className={`${statusConfig.color} border`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Descripción del estado */}
                  <div className="mb-4 p-3 bg-gray-500/10 rounded-lg border-l-4 border-l-[#040AE0]">
                    <p className="text-sm text-gray-300">
                      <strong>Estado:</strong> {statusConfig.description}
                    </p>
                  </div>

                  {/* Info del cliente */}
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-white">
                      {order.user.firstName} {order.user.lastName}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">{order.user.email}</span>
                  </div>

                  {/* Productos */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#040AE0]" />
                          <span className="text-white">
                            {item.product?.nombre || 'Producto eliminado'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">x{item.quantity}</span>
                          <span className="text-white font-medium">
                            {formatPrice(item.totalPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total y Acciones */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-lg font-bold text-white">
                      Total: {formatPrice(order.totalAmount)}
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setSelectedOrder(order)}
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                      
                      {order.paymentStatus === "PAID" && statusConfig.nextStatus && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, statusConfig.nextStatus!)}
                          disabled={updating === order.id}
                          className="bg-[#040AE0] hover:bg-[#040AE0]/90"
                        >
                          {updating === order.id ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <StatusIcon className="w-4 h-4 mr-2" />
                          )}
                          {getStatusConfig(statusConfig.nextStatus!).label}
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => setShowDeleteConfirm(order.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                      >
                        {updating === order.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
