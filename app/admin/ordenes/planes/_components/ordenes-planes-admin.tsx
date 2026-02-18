"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Package,
  User,
  Calendar,
  MapPin,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Crown,
  Star,
  Edit,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

interface User {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
}

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  duracion: string;
  tipo: string;
  esVip: boolean;
}

interface Sede {
  id: string;
  nombre: string;
}

interface PlanOrder {
  id: string;
  userId: string;
  planId: string;
  sedeId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  plan: Plan;
  sede: Sede;
}

interface OrdenesPlanesAdminProps {
  planOrders: PlanOrder[];
}

export function OrdenesPlanesAdmin({ planOrders }: OrdenesPlanesAdminProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState(planOrders);
  const [selectedOrder, setSelectedOrder] = useState<PlanOrder | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  
  // Hook para estadísticas en tiempo real
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats(30000); // Actualizar cada 30 segundos
  
  // Estado para prevenir errores de hidratación
  const [mounted, setMounted] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prevenir errores de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "VERIFIED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "VERIFIED":
        return <CheckCircle className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pendiente";
      case "VERIFIED":
        return "Verificado";
      case "CANCELLED":
        return "Cancelado";
      default:
        return status;
    }
  };

  // Filtrar órdenes por término de búsqueda
  useState(() => {
    const filtered = planOrders.filter((order) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.user.firstName.toLowerCase().includes(searchLower) ||
        order.user.lastName?.toLowerCase().includes(searchLower) ||
        order.user.email.toLowerCase().includes(searchLower) ||
        order.plan.nombre.toLowerCase().includes(searchLower) ||
        order.sede.nombre.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower)
      );
    });
    setFilteredOrders(filtered);
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filtered = planOrders.filter((order) => {
      const searchLower = value.toLowerCase();
      return (
        order.user.firstName.toLowerCase().includes(searchLower) ||
        order.user.lastName?.toLowerCase().includes(searchLower) ||
        order.user.email.toLowerCase().includes(searchLower) ||
        order.plan.nombre.toLowerCase().includes(searchLower) ||
        order.sede.nombre.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower)
      );
    });
    setFilteredOrders(filtered);
  };

  const handleEditOrder = (order: PlanOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsEditModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`/api/admin/plan-orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }

      toast.success('Estado actualizado correctamente');
      setIsEditModalOpen(false);
      setSelectedOrder(null);
      
      // Recargar la página para actualizar los datos
      window.location.reload();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Órdenes de Planes
          </h1>
          <p className="text-muted-foreground">
            Gestiona las órdenes de planes de membresía
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      {mounted && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#D604E0]/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-gradient-to-r from-[#D604E0]/20 to-[#040AE0]/20 flex items-center justify-center">
                  <Package className="h-8 w-8 text-[#D604E0]" />
                </div>
                <div className="flex-1">
                  <p className="text-3xl font-bold text-white">
                    {statsLoading ? "..." : stats?.planStats.totalOrders || 0}
                  </p>
                  <p className="text-sm text-[#A0A0A0]">Total Órdenes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#F59E0B]/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-gradient-to-r from-[#F59E0B]/20 to-[#F59E0B]/10 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-[#F59E0B]" />
                </div>
                <div className="flex-1">
                  <p className="text-3xl font-bold text-white">
                    {statsLoading ? "..." : stats?.planStats.pending || 0}
                  </p>
                  <p className="text-sm text-[#A0A0A0]">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#10B981]/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-gradient-to-r from-[#10B981]/20 to-[#10B981]/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-[#10B981]" />
                </div>
                <div className="flex-1">
                  <p className="text-3xl font-bold text-white">
                    {statsLoading ? "..." : stats?.planStats.verified || 0}
                  </p>
                  <p className="text-sm text-[#A0A0A0]">Verificados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#D604E0]/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-gradient-to-r from-[#D604E0]/20 to-[#D604E0]/10 flex items-center justify-center">
                  <Crown className="h-8 w-8 text-[#D604E0]" />
                </div>
                <div className="flex-1">
                  <p className="text-3xl font-bold text-white">
                    {statsLoading ? "..." : formatCurrency(stats?.planStats.totalRevenue || 0)}
                  </p>
                  <p className="text-sm text-[#A0A0A0]">Total de todas las órdenes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Búsqueda */}
      <Card className="bg-[#1A1A1A] border-[#2A2A2A2]">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#A0A0A0]" />
            <Input
              placeholder="Buscar por cliente, plan, sede o ID..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de órdenes */}
      <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="text-white">Lista de Órdenes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-[#2A2A2A]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2A2A2A]">
                  <TableHead className="text-[#F8F8F8]">ID</TableHead>
                  <TableHead className="text-[#F8F8F8]">Cliente</TableHead>
                  <TableHead className="text-[#F8F8F8]">Plan</TableHead>
                  <TableHead className="text-[#F8F8F8]">Duración</TableHead>
                  <TableHead className="text-[#F8F8F8]">Total</TableHead>
                  <TableHead className="text-[#F8F8F8]">Sede</TableHead>
                  <TableHead className="text-[#F8F8F8]">Estado</TableHead>
                  <TableHead className="text-[#F8F8F8]">Fecha</TableHead>
                  <TableHead className="text-[#F8F8F8]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-[#A0A0A0]"
                    >
                      No se encontraron órdenes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="border-[#2A2A2A] hover:bg-[#2A2A2A]/50"
                    >
                      <TableCell className="text-[#F8F8F8] font-mono text-xs">
                        {order.id.slice(-8)}
                      </TableCell>
                      <TableCell className="text-[#F8F8F8]">
                        <div>
                          <div className="font-medium">
                            {order.user.firstName} {order.user.lastName}
                          </div>
                          <div className="text-sm text-[#A0A0A0]">
                            {order.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#F8F8F8]">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {order.plan.esVip ? (
                              <Crown className="w-4 h-4 text-[#D604E0]" />
                            ) : (
                              <Star className="w-4 h-4 text-[#040AE0]" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{order.plan.nombre}</div>
                            <div className="text-xs text-[#A0A0A0]">
                              {order.plan.tipo}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#F8F8F8]">
                        {order.plan.duracion}
                      </TableCell>
                      <TableCell className="text-[#F8F8F8] font-medium">
                        {formatCurrency(order.totalPrice)}
                      </TableCell>
                      <TableCell className="text-[#F8F8F8]">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#040AE0]" />
                          {order.sede.nombre}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#F8F8F8]">
                        <Badge
                          className={`flex items-center gap-1 border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {getStatusText(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#F8F8F8]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#A0A0A0]" />
                          {new Date(order.createdAt).toLocaleDateString("es-CO")}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#F8F8F8]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditOrder(order)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de edición de estado */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Estado de Orden de Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOrder && (
              <div className="space-y-4">
                <div className="bg-[#0A0A0A] p-4 rounded-lg">
                  <h3 className="text-white font-medium mb-2">Detalles de la Orden</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#A0A0A0]">ID:</span>
                      <span className="text-white font-mono">{selectedOrder.id.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0A0A0]">Cliente:</span>
                      <span className="text-white">{selectedOrder.user.firstName} {selectedOrder.user.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0A0A0]">Plan:</span>
                      <span className="text-white">{selectedOrder.plan.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0A0A0]">Duración:</span>
                      <span className="text-white">{selectedOrder.plan.duracion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0A0A0]">Total:</span>
                      <span className="text-white">{formatCurrency(selectedOrder.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0A0A0]">Estado Actual:</span>
                      <Badge className={`flex items-center gap-1 border ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        {getStatusText(selectedOrder.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-white">Nuevo Estado</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-[#1E1E1E]">
                      <SelectItem value="PENDING" className="text-white">Pendiente</SelectItem>
                      <SelectItem value="VERIFIED" className="text-white">Verificado</SelectItem>
                      <SelectItem value="CANCELLED" className="text-white">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedOrder.status !== "VERIFIED" && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ Solo los planes con estado "Verificado" pueden ser activados para los clientes.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="bg-[#2A2A2A] text-white border-[#3A3A3A] hover:bg-[#3A3A3A]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdateStatus}
                    className="bg-[#040AE0] hover:bg-[#0308CC] text-white"
                  >
                    Actualizar Estado
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
