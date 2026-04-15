"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaymentStatusText } from "@/lib/payment-status-utils";

// Función para formatear moneda en pesos colombianos
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingBag,
  Clock,
  Package,
  Truck,
  CheckCircle,
  Search,
  Edit,
  Eye,
  Filter,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { OrderDetailModal } from "@/components/admin/order-detail-modal";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

interface User {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
}

interface Product {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
  imagen: string | null;
  descripcion: string | null;
}

interface PaymentGateway {
  id: string;
  nombre: string;
  tipo: string;
  cuentaBanco: string;
}

interface Payment {
  id: string;
  paymentMethod: string;
  status: string;
  amount: number;
  transactionId: string;
  createdAt: Date;
}

interface Sede {
  id: string;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
  telefono: string | null;
  email: string | null;
  paymentGateway?: PaymentGateway;
}

interface ProductOrder {
  id: string;
  userId: string;
  productId: string | null;
  sedeId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  product: Product | null;
  sede: Sede;
  payment?: Payment;
  items?: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: Product;
  }[];
  // Campos del webhook de Bold
  customerName?: string;
  customerEmail?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
}

interface OrdenesProductosAdminProps {
  productOrders: ProductOrder[];
}

export function OrdenesProductosAdmin({ productOrders }: OrdenesProductosAdminProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState(productOrders);
  const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);
  const [orders, setOrders] = useState(productOrders); // Estado local para actualizaciones
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  
  // Hook para estadísticas en tiempo real
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats(30000); // Actualizar cada 30 segundos
  
  // Estado para prevenir errores de hidratación
  const [mounted, setMounted] = useState(false);
  
  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sedeFilter, setSedeFilter] = useState<string>("all");

  // Prevenir errores de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Estados para el panel de detalles
  const [shippingMethod, setShippingMethod] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Función para transformar los datos al formato del nuevo modal
  const transformOrderData = (order: ProductOrder) => {
    const getStatusText = (status: string) => {
      switch (status) {
        case "PENDING":
          return "Orden Creada";
        case "PACKED":
          return "Empacado";
        case "SHIPPED":
          return "Enviado";
        case "DELIVERED":
          return "Entregado";
        case "CANCELLED":
          return "Cancelado";
        default:
          return "Orden Creada";
      }
    };

    const getStatusTimeline = (status: string) => {
      type TimelineStatus = "completed" | "current" | "pending";
      const baseTimeline: { label: string; date: string; status: TimelineStatus }[] = [
        { label: "Orden Creada", date: new Date(order.createdAt).toLocaleString("es-CO"), status: "completed" },
      ];

      if (status === "PACKED" || status === "SHIPPED" || status === "DELIVERED") {
        baseTimeline.push({ label: "Empacado", date: "Procesado", status: "completed" });
      }

      if (status === "SHIPPED" || status === "DELIVERED") {
        baseTimeline.push({ label: "Enviado", date: "En camino", status: "completed" });
      }

      if (status === "DELIVERED") {
        baseTimeline.push({ label: "Entregado", date: "Recibido por el cliente", status: "completed" });
      } else if (status === "SHIPPED") {
        baseTimeline.push({ label: "Entregado", date: "Pendiente", status: "pending" });
      } else if (status === "PACKED") {
        baseTimeline.push({ label: "Enviado", date: "Pendiente", status: "pending" });
        baseTimeline.push({ label: "Entregado", date: "Pendiente", status: "pending" });
      } else {
        baseTimeline.push({ label: "Empacado", date: "Pendiente", status: "pending" });
        baseTimeline.push({ label: "Enviado", date: "Pendiente", status: "pending" });
        baseTimeline.push({ label: "Entregado", date: "Pendiente", status: "pending" });
      }

      return baseTimeline;
    };

    return {
      id: order.id,
      date: new Date(order.createdAt).toLocaleString("es-CO"),
      total: formatCurrency(order.totalPrice),
      status: getStatusText(order.status) as any,
      timeline: getStatusTimeline(order.status),
      client: {
        name: order.customerName || `${order.user.firstName} ${order.user.lastName || ""}`,
        email: order.customerEmail || order.user.email,
        phone: order.shippingPhone || "No disponible",
        address: order.shippingAddress,
        city: order.shippingCity
      },
      product: order.items && order.items.length > 0 ? {
        name: `${order.items.length} productos`,
        category: "Varios",
        description: order.items.map(i => `${i.product.nombre} (x${i.quantity})`).join(', '),
        image: order.items[0]?.product.imagen || "",
        quantity: order.items.reduce((sum, i) => sum + i.quantity, 0),
        unitPrice: formatCurrency(order.unitPrice),
        subtotal: formatCurrency(order.items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0)),
        total: formatCurrency(order.totalPrice)
      } : order.product ? {
        name: order.product.nombre,
        category: order.product.categoria,
        description: order.product.descripcion || "Producto de alta calidad",
        image: order.product.imagen || "",
        quantity: order.quantity,
        unitPrice: formatCurrency(order.unitPrice),
        subtotal: formatCurrency(order.unitPrice * order.quantity),
        total: formatCurrency(order.totalPrice)
      } : {
        name: "Producto no disponible",
        category: "-",
        description: "-",
        image: "",
        quantity: order.quantity,
        unitPrice: formatCurrency(order.unitPrice),
        subtotal: formatCurrency(order.unitPrice * order.quantity),
        total: formatCurrency(order.totalPrice)
      },
      location: {
        name: order.sede.nombre,
        address: order.sede.direccion,
        city: order.sede.ciudad,
        phone: order.sede.telefono,
        email: order.sede.email,
        paymentAccount: order.sede.paymentGateway?.cuentaBanco || "No especificada"
      },
      payment: order.payment ? {
        method: order.payment.paymentMethod,
        status: getPaymentStatusText(order.payment.status as any),
        amount: formatCurrency(order.payment.amount),
        date: new Date(order.payment.createdAt).toLocaleDateString("es-CO"),
        transactionId: order.payment.transactionId
      } : null,
      shipping: {
        method: "Envio estandar",
        trackingNumber: "",
        notes: ""
      }
    };
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "PENDING":
        return <div className="w-3 h-3 rounded-full bg-gray-500" />;
      case "PAID":
      case "CONFIRMED":
        return <div className="w-3 h-3 rounded-full bg-green-500" />;
      case "PACKED":
        return <div className="w-3 h-3 rounded-full bg-green-500" />;
      case "SHIPPED":
        return <div className="w-3 h-3 rounded-full bg-green-500" />;
      case "DELIVERED":
        return <div className="w-3 h-3 rounded-full bg-green-500" />;
      case "CANCELLED":
        return <div className="w-3 h-3 rounded-full bg-red-500" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-500" />;
    }
  };

  // Función para obtener el color del punto según el estado de la orden
  const getStatusIndicatorForOrder = (order: ProductOrder, columnIndex: number) => {
    // Solo renderizar en cliente
    if (!mounted) {
      return <div className="w-3 h-3 rounded-full bg-gray-500 mx-auto" />;
    }
    
    if (order.status === "CANCELLED") {
      return <div className="w-3 h-3 rounded-full bg-red-500 mx-auto" />;
    }
    
    // Estados que indican que la orden está pagada (incluye PAGO y VERIFIED)
    const paidStatuses = ["PAGO", "PAID", "CONFIRMED", "VERIFIED", "PACKED", "SHIPPED", "DELIVERED"];
    const isPaid = paidStatuses.includes(order.status);
    
    // Lógica específica para cada columna - manteniendo anteriores verdes
    switch (columnIndex) {
      case 0: // Pagado
        return (
          <div 
            className="w-3 h-3 rounded-full mx-auto" 
            style={{ backgroundColor: isPaid ? '#22C55E' : '#6B7280' }}
            title={`Status: ${order.status}, Pagado: ${isPaid ? 'Sí' : 'No'}`}
          />
        );
      case 1: // Verificado (se pone verde cuando está verificado o superior)
        return (
          <div 
            className="w-3 h-3 rounded-full mx-auto" 
            style={{ backgroundColor: ["VERIFIED", "PACKED", "SHIPPED", "DELIVERED"].includes(order.status) ? '#22C55E' : '#6B7280' }}
            title={`Verificado: ${["VERIFIED", "PACKED", "SHIPPED", "DELIVERED"].includes(order.status) ? 'Sí' : 'No'}`}
          />
        );
      case 2: // Empacado (se pone verde cuando está empacado o superior)
        return (
          <div 
            className="w-3 h-3 rounded-full mx-auto" 
            style={{ backgroundColor: ["PACKED", "SHIPPED", "DELIVERED"].includes(order.status) ? '#22C55E' : '#6B7280' }}
            title={`Empacado: ${["PACKED", "SHIPPED", "DELIVERED"].includes(order.status) ? 'Sí' : 'No'}`}
          />
        );
      case 3: // Enviado (se pone verde cuando está enviado o entregado)
        return (
          <div 
            className="w-3 h-3 rounded-full mx-auto" 
            style={{ backgroundColor: ["SHIPPED", "DELIVERED"].includes(order.status) ? '#22C55E' : '#6B7280' }}
            title={`Enviado: ${["SHIPPED", "DELIVERED"].includes(order.status) ? 'Sí' : 'No'}`}
          />
        );
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-500 mx-auto" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-white/20 text-white border-white/50";
      case "PACKED":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "SHIPPED":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "DELIVERED":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-white/20 text-white border-white/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "PACKED":
        return <Package className="w-4 h-4" />;
      case "SHIPPED":
        return <Truck className="w-4 h-4" />;
      case "DELIVERED":
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
      case "PACKED":
        return "Empacado";
      case "SHIPPED":
        return "Enviado";
      case "DELIVERED":
        return "Entregado";
      case "CANCELLED":
        return "Cancelado";
      default:
        return status;
    }
  };

  // Filtrar órdenes por término de búsqueda
  useEffect(() => {
    const filtered = productOrders.filter((order) => {
      const searchLower = searchTerm.toLowerCase();
      const productNames = order.items?.map(i => i.product.nombre).join(' ') || order.product?.nombre || '';
      return (
        order.user.firstName.toLowerCase().includes(searchLower) ||
        order.user.lastName?.toLowerCase().includes(searchLower) ||
        order.user.email.toLowerCase().includes(searchLower) ||
        productNames.toLowerCase().includes(searchLower) ||
        order.sede.nombre.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower)
      );
    });
    setFilteredOrders(filtered);
  }, [searchTerm, productOrders]);

  // Prevenir errores de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleViewDetails = (order: ProductOrder) => {
    setSelectedOrder(order);
    setIsDetailPanelOpen(true);
  };

  // Función para actualizar las órdenes cuando el modal guarda cambios
  const handleOrderUpdated = () => {
    // Recargar los datos desde el servidor para obtener la información más reciente
    fetch('/api/admin/product-orders')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOrders(data.orders);
          setFilteredOrders(data.orders);
        }
      })
      .catch(error => {
        console.error('Error reloading orders:', error);
      });
  };

  // Función para aplicar filtros
  const applyFilters = () => {
    let filtered = orders;
    
    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter((order) => {
        const searchLower = searchTerm.toLowerCase();
        const productNames = order.items?.map(i => i.product.nombre).join(' ') || order.product?.nombre || '';
        return (
          order.user.firstName.toLowerCase().includes(searchLower) ||
          order.user.lastName?.toLowerCase().includes(searchLower) ||
          order.user.email.toLowerCase().includes(searchLower) ||
          productNames.toLowerCase().includes(searchLower) ||
          order.sede.nombre.toLowerCase().includes(searchLower) ||
          order.id.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Filtro por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Filtro por sede
    if (sedeFilter !== "all") {
      filtered = filtered.filter(order => order.sede.id === sedeFilter);
    }
    
    setFilteredOrders(filtered);
  };

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, sedeFilter, orders]);

  const handleEditOrder = (order: ProductOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsEditModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`/api/orders/product/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Estado actualizado correctamente');
        setIsEditModalOpen(false);
        setSelectedOrder(null);
        
        // Recargar la página para actualizar los datos (más rápido que reload completo)
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        throw new Error(data.error || 'Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el estado');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Órdenes de Productos
          </h1>
          <p className="text-muted-foreground">
            Gestiona las órdenes de productos de la tienda
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
                  <ShoppingBag className="h-8 w-8 text-[#D604E0]" />
                </div>
                <div className="flex-1">
                  <p className="text-3xl font-bold text-white">
                    {statsLoading ? "..." : stats?.productStats.totalOrders || 0}
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
                    {statsLoading ? "..." : stats?.productStats.pending || 0}
                  </p>
                  <p className="text-sm text-[#A0A0A0]">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#8B5CF6]/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#8B5CF6]/10 flex items-center justify-center">
                  <Truck className="h-8 w-8 text-[#8B5CF6]" />
                </div>
                <div className="flex-1">
                  <p className="text-3xl font-bold text-white">
                    {statsLoading ? "..." : stats?.productStats.shipped || 0}
                  </p>
                  <p className="text-sm text-[#A0A0A0]">Enviados</p>
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
                    {statsLoading ? "..." : formatCurrency(stats?.productStats.totalRevenue || 0)}
                  </p>
                  <p className="text-sm text-[#A0A0A0]">Ganancias Totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#A0A0A0]" />
              <Input
                placeholder="Buscar por cliente, producto, sede o ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
              />
            </div>
            
            {/* Filtros */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#A0A0A0]" />
                <span className="text-[#A0A0A0] text-sm">Filtros:</span>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-[#0A0A0A] border-[#1E1E1E] text-white">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-[#1E1E1E]">
                  <SelectItem value="all" className="text-white">Todos los estados</SelectItem>
                  <SelectItem value="PENDING" className="text-white">Pendiente</SelectItem>
                  <SelectItem value="PAGO" className="text-white">Pagado</SelectItem>
                  <SelectItem value="VERIFIED" className="text-white">Verificado</SelectItem>
                  <SelectItem value="PACKED" className="text-white">Empacado</SelectItem>
                  <SelectItem value="SHIPPED" className="text-white">Enviado</SelectItem>
                  <SelectItem value="DELIVERED" className="text-white">Entregado</SelectItem>
                  <SelectItem value="CANCELLED" className="text-white">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sedeFilter} onValueChange={setSedeFilter}>
                <SelectTrigger className="w-40 bg-[#0A0A0A] border-[#1E1E1E] text-white">
                  <SelectValue placeholder="Sede" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-[#1E1E1E]">
                  <SelectItem value="all" className="text-white">Todas las sedes</SelectItem>
                  {Array.from(new Set(productOrders.map(order => JSON.stringify(order.sede)))).map(sedeStr => {
                    const sede = JSON.parse(sedeStr);
                    return (
                      <SelectItem key={`${sede.id}-${sede.nombre}`} value={sede.id} className="text-white">
                        {sede.nombre}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
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
                  <TableHead className="text-[#F8F8F8] w-20">ID</TableHead>
                  <TableHead className="text-[#F8F8F8] min-w-40">Cliente</TableHead>
                  <TableHead className="text-[#F8F8F8] min-w-32">Producto</TableHead>
                  <TableHead className="text-[#F8F8F8] text-center w-20">Cant.</TableHead>
                  <TableHead className="text-[#F8F8F8] text-right w-28">Total</TableHead>
                  <TableHead className="text-[#F8F8F8] text-center w-20">Pagado</TableHead>
                  <TableHead className="text-[#F8F8F8] text-center w-20">Verificado</TableHead>
                  <TableHead className="text-[#F8F8F8] text-center w-20">Empacado</TableHead>
                  <TableHead className="text-[#F8F8F8] text-center w-20">Enviado</TableHead>
                  <TableHead className="text-[#F8F8F8] text-center w-28">Fecha</TableHead>
                  <TableHead className="text-[#F8F8F8] text-center w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
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
                      <TableCell className="text-[#F8F8F8]">
                        <span className="font-mono text-xs">{order.id.slice(-8)}</span>
                      </TableCell>
                      <TableCell className="text-[#F8F8F8]">
                        <div className="max-w-32">
                          <p className="font-medium truncate">{order.user.firstName} {order.user.lastName}</p>
                          <p className="text-xs text-[#A0A0A0] truncate">{order.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#F8F8F8]">
                        <div className="max-w-40">
                          {order.items && order.items.length > 0 ? (
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <span className="font-medium truncate text-sm">{item.product.nombre}</span>
                                  <span className="text-xs text-[#A0A0A0]">x{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          ) : order.product ? (
                            <div>
                              <p className="font-medium truncate">{order.product.nombre}</p>
                              <p className="text-xs text-[#A0A0A0] truncate">{order.product.categoria}</p>
                            </div>
                          ) : (
                            <span className="text-[#A0A0A0] text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#F8F8F8] text-center font-medium">
                        {order.quantity}
                      </TableCell>
                      <TableCell className="text-[#F8F8F8] text-right font-medium">
                        {formatCurrency(order.totalPrice)}
                      </TableCell>
                      <TableCell className="text-[#F8F8F8] text-center">
                        {getStatusIndicatorForOrder(order, 0)}
                      </TableCell>
                      <TableCell className="text-[#F8F8F8] text-center">
                        {getStatusIndicatorForOrder(order, 1)}
                      </TableCell>
                      <TableCell className="text-[#F8F8F8] text-center">
                        {getStatusIndicatorForOrder(order, 2)}
                      </TableCell>
                      <TableCell className="text-[#F8F8F8] text-center">
                        {getStatusIndicatorForOrder(order, 3)}
                      </TableCell>
                      <TableCell className="text-[#F8F8F8] text-center">
                        <div className="text-xs">
                          <div>{new Date(order.createdAt).toLocaleDateString("es-CO", { day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#F8F8F8]">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                            className="text-[#D604E0] hover:text-[#D604E0] hover:bg-[#D604E0]/10 border-[#D604E0]/30 px-3 py-1 h-8"
                          >
                            Ver Detalles
                          </Button>
                        </div>
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
            <DialogTitle className="text-white">Editar Estado de Orden</DialogTitle>
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
                      <span className="text-[#A0A0A0]">Producto:</span>
                      <span className="text-white">
                        {selectedOrder.items && selectedOrder.items.length > 0 
                          ? `${selectedOrder.items.length} productos`
                          : selectedOrder.product?.nombre || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0A0A0]">Total:</span>
                      <span className="text-white">{formatCurrency(selectedOrder.totalPrice)}</span>
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
                      <SelectItem value="PAGO" className="text-white">Pagado</SelectItem>
                      <SelectItem value="VERIFIED" className="text-white">Verificado</SelectItem>
                      <SelectItem value="PACKED" className="text-white">Empacado</SelectItem>
                      <SelectItem value="SHIPPED" className="text-white">Enviado</SelectItem>
                      <SelectItem value="DELIVERED" className="text-white">Entregado</SelectItem>
                      <SelectItem value="CANCELLED" className="text-white">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

      {/* Nuevo Modal de Detalles */}
      {selectedOrder && (
        <OrderDetailModal
          open={isDetailPanelOpen}
          onOpenChange={setIsDetailPanelOpen}
          orderId={selectedOrder.id}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </div>
  );
}
