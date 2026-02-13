"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Calendar, User, TrendingUp, Eye } from "lucide-react";
import { motion } from "framer-motion";

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    nombre: string;
    imagen: string | null;
  };
  order: {
    id: string;
    createdAt: Date;
    orderNumber: string;
    user: {
      firstName: string;
      lastName?: string;
      email: string;
    };
    totalAmount: number;
  };
}

interface OrdersStatsProps {
  orders: OrderItem[];
}

export function OrdersStats({ orders }: OrdersStatsProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Calcular estadísticas
  const totalOrders = new Set(orders.map(item => item.order.id)).size;
  const totalRevenue = orders.reduce((sum, item) => sum + item.order.totalAmount, 0);
  const totalItems = orders.reduce((sum, item) => sum + item.quantity, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Agrupar órdenes por fecha
  const ordersByDate = orders.reduce((acc, item) => {
    const date = new Date(item.order.createdAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = {
        date,
        orders: new Set(),
        revenue: 0,
        items: 0,
        users: new Set()
      };
    }
    acc[date].orders.add(item.order.id);
    acc[date].revenue += item.order.totalAmount;
    acc[date].items += item.quantity;
    acc[date].users.add(item.order.user.email);
    return acc;
  }, {} as Record<string, {
    date: string;
    orders: Set<string>;
    revenue: number;
    items: number;
    users: Set<string>;
  }>);

  const sortedDates = Object.values(ordersByDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10); // Últimos 10 días

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-[#1A1A1A] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Órdenes Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalOrders}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-[#1A1A1A] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Ingresos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold gradient-text">{formatPrice(totalRevenue)}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-[#1A1A1A] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Productos Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalItems}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-[#1A1A1A] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Promedio por Orden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatPrice(averageOrderValue)}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabla de detalles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Órdenes por Día
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showDetails ? "Ocultar" : "Mostrar"} Detalles
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Fecha</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Órdenes</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Productos</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Ingresos</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Clientes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDates.map((dayData, index) => (
                    <motion.tr
                      key={dayData.date}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="py-3 px-4 text-sm text-white">{formatDate(dayData.date)}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="border-[#040AE0] text-[#040AE0]">
                          {dayData.orders.size}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-white">{dayData.items}</td>
                      <td className="py-3 px-4 text-right text-white font-medium">
                        {formatPrice(dayData.revenue)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="border-[#D604E0] text-[#D604E0]">
                          {dayData.users.size}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ delay: 0.2 }}
                className="mt-6 pt-6 border-t border-white/10"
              >
                <h4 className="text-white font-medium mb-4">Detalles de Órdenes Recientes</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {orders.slice(0, 20).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-[#141414] rounded-lg p-3 border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-white">
                            {item.order.user.firstName} {item.order.user.lastName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(item.order.createdAt).toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-[#040AE0]" />
                          <span className="text-sm text-white">{item.product?.nombre || 'Producto eliminado'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">x{item.quantity}</span>
                          <span className="text-sm font-medium text-white">
                            {formatPrice(item.order.totalAmount / orders.filter(o => o.order.id === item.order.id).reduce((sum, o) => sum + o.quantity, 0) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
