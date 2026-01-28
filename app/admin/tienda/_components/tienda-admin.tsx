"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CustomSwitch } from "@/components/ui/custom-switch";
import { ControlledInput } from "@/components/ui/controlled-input";
import { ControlledTextarea } from "@/components/ui/controlled-textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingBag, Edit, Trash2, Plus, Package, DollarSign, MapPin, Star, Eye, Calendar, User, TrendingUp, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { OrdersStats } from "./orders-stats";

interface Sede {
  id: string;
  nombre: string;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string | null;
  categoria: string;
  stock: number;
  activo: boolean;
  destacado: boolean;
  sedeId: string;
  createdAt: Date;
  updatedAt: Date;
  sede: Sede;
  _count: {
    orderItems: number;
  };
}

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

interface TiendaAdminProps {
  productos: Producto[];
  sedes: Sede[];
  orderItems?: OrderItem[];
}

const categorias = [
  "GENERAL",
  "SUPLEMENTOS",
  "ROPA",
  "ACCESORIOS",
  "EQUIPO",
  "NUTRICIÓN",
  "OTROS",
];

export function TiendaAdmin({ productos, sedes, orderItems }: TiendaAdminProps) {
  const [productosList, setProductosList] = useState<Producto[]>(productos);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("productos");

  // Manejar el caso cuando orderItems es undefined
  const orderItemsList = orderItems || [];

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: 0,
    imagen: "",
    categoria: "GENERAL",
    stock: 0,
    activo: true,
    destacado: false,
  });

  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      precio: 0,
      imagen: "",
      categoria: "GENERAL",
      stock: 0,
      activo: true,
      destacado: false,
    });
    setImagenFile(null);
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      let imageUrl = formData.imagen;
      
      // Si hay un archivo de imagen, subirlo al servidor
      if (imagenFile) {
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('file', imagenFile);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload,
          });
          
          if (!uploadResponse.ok) {
            console.warn('Error al subir imagen, usando placeholder');
            imageUrl = 'https://cdn.abacus.ai/images/223406aa-b7ac-4de5-bd3a-93424a34a9e8.png';
          } else {
            const uploadResult = await uploadResponse.json();
            imageUrl = uploadResult.url;
          }
        } catch (error) {
          console.warn('Error al subir imagen, usando placeholder:', error);
          imageUrl = 'https://cdn.abacus.ai/images/223406aa-b7ac-4de5-bd3a-93424a34a9e8.png';
        }
      }
      
      const response = await fetch("/api/admin/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          imagen: imageUrl,
        }),
      });

      if (!response.ok) throw new Error("Error al crear producto");

      const newProducto = await response.json();
      setProductosList([...productosList, newProducto]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Producto creado exitosamente");
    } catch (error) {
      toast.error("Error al crear producto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagen: producto.imagen || "",
      categoria: producto.categoria,
      stock: producto.stock,
      activo: producto.activo,
      destacado: producto.destacado,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingProducto) return;

    setIsLoading(true);
    try {
      let imageUrl = formData.imagen;
      
      // Si hay un archivo de imagen, subirlo al servidor
      if (imagenFile) {
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('file', imagenFile);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload,
          });
          
          if (!uploadResponse.ok) {
            console.warn('Error al subir imagen, usando placeholder');
            imageUrl = 'https://cdn.abacus.ai/images/223406aa-b7ac-4de5-bd3a-93424a34a9e8.png';
          } else {
            const uploadResult = await uploadResponse.json();
            imageUrl = uploadResult.url;
          }
        } catch (error) {
          console.warn('Error al subir imagen, usando placeholder:', error);
          imageUrl = 'https://cdn.abacus.ai/images/223406aa-b7ac-4de5-bd3a-93424a34a9e8.png';
        }
      }
      
      const response = await fetch(`/api/admin/productos/${editingProducto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          imagen: imageUrl,
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar producto");

      const updatedProducto = await response.json();
      setProductosList(productosList.map((p) => (p.id === updatedProducto.id ? updatedProducto : p)));
      setIsEditDialogOpen(false);
      setEditingProducto(null);
      resetForm();
      toast.success("Producto actualizado exitosamente");
    } catch (error) {
      toast.error("Error al actualizar producto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/productos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar producto");

      setProductosList(productosList.filter((p) => p.id !== id));
      toast.success("Producto eliminado exitosamente");
    } catch (error) {
      toast.error("Error al eliminar producto");
    } finally {
      setIsLoading(false);
    }
  };
  return(      <div className="space-y-6">
      {/* Header con tabs */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Tienda</h1>
          <p className="text-muted-foreground">
            Gestiona productos y órdenes
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gradient-bg hover:opacity-90 transition-opacity">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
            <DialogHeader>
              <DialogTitle className="gradient-text">Crear Nuevo Producto</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-[#F8F8F8]">Nombre</Label>
                  <ControlledInput
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del producto"
                    maxLength={100}
                    showCharCount={true}
                    showWarning={true}
                    className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precio" className="text-[#F8F8F8]">Precio</Label>
                  <ControlledInput
                    id="precio"
                    type="number"
                    step="1"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                    placeholder="0"
                    maxLength={10}
                    showCharCount={true}
                    showWarning={true}
                    className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-[#F8F8F8]">Descripción</Label>
                <ControlledTextarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del producto"
                  rows={3}
                  maxLength={500}
                  showCharCount={true}
                  showWarning={true}
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria" className="text-[#F8F8F8]">Categoría</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-[#1E1E1E]">
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria} value={categoria} className="text-white hover:bg-[#1E1E1E] focus:bg-[#D604E0]">
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-[#F8F8F8]">Stock</Label>
                  <ControlledInput
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                    placeholder="0"
                    maxLength={6}
                    showCharCount={true}
                    showWarning={true}
                    className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imagen" className="text-[#F8F8F8F]">Imagen del Producto</Label>
                <div className="border-2 border-dashed border-[#1E1E1E] rounded-lg p-4">
                  <input
                    type="file"
                    id="imagen"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImagenFile(file);
                        // Preview de la imagen
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, imagen: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="imagen"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {formData.imagen || imagenFile ? (
                      <div className="relative">
                        <img
                          src={formData.imagen || (imagenFile ? URL.createObjectURL(imagenFile) : "")}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagenFile(null);
                            setFormData({ ...formData, imagen: "" });
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-xs hover:bg-red-700 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-[#A0A0A0] mb-2" />
                        <p className="text-sm text-[#A0A0A0]">Click para subir imagen</p>
                        <p className="text-xs text-[#A0A0A0]">PNG, JPG hasta 10MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CustomSwitch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                  <Label htmlFor="activo" className="text-[#F8F8F8]">Activo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <CustomSwitch
                    id="destacado"
                    checked={formData.destacado}
                    onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                  />
                  <Label htmlFor="destacado" className="text-[#F8F8F8]">Destacado</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white">
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isLoading} className="gradient-bg hover:opacity-90">
                {isLoading ? "Creando..." : "Crear Producto"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Menú de navegación simple */}
      <div className="bg-[#141414] rounded-lg p-1 flex gap-1">
        <button
          onClick={() => setActiveTab("productos")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
            activeTab === "productos"
              ? "bg-[#040AE0] text-white"
              : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Productos
        </button>
        <button
          onClick={() => setActiveTab("ordenes")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
            activeTab === "ordenes"
              ? "bg-[#040AE0] text-white"
              : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <Eye className="w-4 h-4" />
          Órdenes
        </button>
      </div>

      {/* Contenido según tab activa */}
      {activeTab === "productos" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {productosList.map((producto, index) => (
            <motion.div
              key={producto.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-xl overflow-hidden transition-all duration-300 bg-[#1A1A1A] border border-white/10 hover:border-white/20 card-glow-hover`}
            >
              {/* Badge de AGOTADO */}
              {producto.stock === 0 && (
                <div className="absolute top-2 left-2 z-10">
                  <span className="px-2 py-1 bg-red-600 rounded-full text-white text-xs font-bold">
                    AGOTADO
                  </span>
                </div>
              )}

              {/* Imagen del producto */}
              <div className="aspect-square bg-gradient-to-br from-[#040AE0]/10 to-[#D604E0]/10 overflow-hidden relative">
                {producto.imagen ? (
                  <img 
                    src={producto.imagen.split(',')[0]} 
                    alt={producto.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-[#040AE0]/30" />
                  </div>
                )}
              </div>

              {/* Contenido de la card */}
              <div className="p-3">
                {/* Nombre */}
                <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">
                  {producto.nombre}
                </h3>
                
                {/* Categoría y sede */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#040AE0] font-medium">
                    {producto.categoria}
                  </span>
                </div>

                {/* Precio */}
                <div className="flex items-end justify-between mb-2">
                  <span className="text-lg font-bold text-white">
                    {formatCurrency(producto.precio)}
                  </span>
                  <div className="text-right">
                    {producto.stock > 0 ? (
                      <div className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                        <span className="text-green-400 text-xs font-medium">
                          {producto.stock}
                        </span>
                      </div>
                    ) : (
                      <div className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-full">
                        <span className="text-red-400 text-xs font-medium">
                          0
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(producto)}
                    className="flex-1 h-8 text-xs border-white/20 text-white hover:bg-white/10"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 h-8 text-xs border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#141414] border-[#1E1E1E]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">¿Eliminar producto?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#A0A0A0]">
                          Esta acción no se puede deshacer. Se eliminará permanentemente el producto "{producto.nombre}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-[#1E1E1E] text-[#F8F8F8] hover:bg-[#2A2A2A]">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(producto.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {activeTab === "ordenes" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Estadísticas de órdenes */}
          <OrdersStats orders={orderItemsList} />
          
          {/* Lista de órdenes */}
          <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Órdenes Recientes</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {orderItemsList.slice(0, 20).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#141414] rounded-lg p-4 border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#040AE0] rounded-full"></div>
                        <span className="text-sm text-white font-medium">
                          #{item.order.orderNumber}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(item.order.createdAt).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm text-white font-medium">
                          {item.order.user.firstName} {item.order.user.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{item.order.user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold gradient-text">
                          {formatCurrency(item.order.totalAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#040AE0]" />
                        <span className="text-sm text-white">{item.product.nombre}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">x{item.quantity}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Editar Producto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre" className="text-[#F8F8F8]">Nombre</Label>
                <ControlledInput
                  id="edit-nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del producto"
                  maxLength={100}
                  showCharCount={true}
                  showWarning={true}
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-precio" className="text-[#F8F8F8]">Precio</Label>
                <ControlledInput
                  id="edit-precio"
                  type="number"
                  step="1"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                  placeholder="0"
                  maxLength={10}
                  showCharCount={true}
                  showWarning={true}
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-descripcion" className="text-[#F8F8F8]">Descripción</Label>
              <ControlledTextarea
                id="edit-descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del producto"
                rows={3}
                maxLength={500}
                showCharCount={true}
                showWarning={true}
                className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-categoria" className="text-[#F8F8F8]">Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-[#1E1E1E]">
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria} value={categoria} className="text-white hover:bg-[#1E1E1E] focus:bg-[#D604E0]">
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stock" className="text-[#F8F8F8]">Stock</Label>
                <ControlledInput
                  id="edit-stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                  placeholder="0"
                  maxLength={6}
                  showCharCount={true}
                  showWarning={true}
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-imagen" className="text-[#F8F8F8]">Imagen del Producto</Label>
              <div className="border-2 border-dashed border-[#1E1E1E] rounded-lg p-4">
                <input
                  type="file"
                  id="edit-imagen"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImagenFile(file);
                      // Preview de la imagen
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({ ...formData, imagen: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="edit-imagen"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  {formData.imagen || imagenFile ? (
                    <div className="relative">
                      <img
                        src={formData.imagen || (imagenFile ? URL.createObjectURL(imagenFile) : "")}
                        alt="Preview"
                        className="h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagenFile(null);
                          setFormData({ ...formData, imagen: "" });
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-xs hover:bg-red-700 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-[#A0A0A0] mb-2" />
                      <p className="text-sm text-[#A0A0A0]">Click para subir imagen</p>
                      <p className="text-xs text-[#A0A0A0]">PNG, JPG hasta 10MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CustomSwitch
                  id="edit-activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="edit-activo" className="text-[#F8F8F8]">Activo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <CustomSwitch
                  id="edit-destacado"
                  checked={formData.destacado}
                  onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                />
                <Label htmlFor="edit-destacado" className="text-[#F8F8F8]">Destacado</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white">
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading} className="gradient-bg hover:opacity-90">
              {isLoading ? "Actualizando..." : "Actualizar Producto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
