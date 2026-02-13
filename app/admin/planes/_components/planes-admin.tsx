"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ControlledInput } from "@/components/ui/controlled-input";
import { ControlledTextarea } from "@/components/ui/controlled-textarea";
import { Label } from "@/components/ui/label";
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
import {
  Plus,
  Edit,
  Trash2,
  Star,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Sede {
  id: string;
  nombre: string;
}

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  beneficios: string[];
  duracion: string;
  tipo: string;
  esVip: boolean;
  activo: boolean;
  destacado: boolean;
  orden: number;
  sedes: Sede[];
}

interface PlanesAdminProps {
  planes: Plan[];
  sedes: Sede[];
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

export function PlanesAdmin({ planes, sedes }: PlanesAdminProps) {
  const [planesList, setPlanesList] = useState<Plan[]>(planes);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: 0,
    beneficios: [""],
    duracion: "Mensual",
    tipo: "STANDARD",
    esVip: false,
    activo: true,
    destacado: false,
    orden: 0,
    sedes: [] as Sede[],
  });

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
      beneficios: [""],
      duracion: "Mensual",
      tipo: "STANDARD",
      esVip: false,
      activo: true,
      destacado: false,
      orden: 0,
      sedes: [] as Sede[],
    });
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/planes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error al crear plan");

      const newPlan = await response.json();
      setPlanesList([...planesList, newPlan]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Plan creado exitosamente");
    } catch (error) {
      toast.error("Error al crear plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      precio: plan.precio,
      beneficios: plan.beneficios,
      duracion: plan.duracion,
      tipo: plan.tipo,
      esVip: plan.esVip,
      activo: plan.activo,
      destacado: plan.destacado,
      orden: plan.orden,
      sedes: plan.sedes,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingPlan) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/planes/${editingPlan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error al actualizar plan");

      const updatedPlan = await response.json();
      setPlanesList(planesList.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
      setIsEditDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      toast.success("Plan actualizado exitosamente");
    } catch (error) {
      toast.error("Error al actualizar plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/planes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar plan");

      setPlanesList(planesList.filter((p) => p.id !== id));
      toast.success("Plan eliminado exitosamente");
    } catch (error) {
      toast.error("Error al eliminar plan");
    } finally {
      setIsLoading(false);
    }
  };

  const addBeneficio = () => {
    setFormData({
      ...formData,
      beneficios: [...formData.beneficios, ""],
    });
  };

  const removeBeneficio = (index: number) => {
    setFormData({
      ...formData,
      beneficios: formData.beneficios.filter((_, i) => i !== index),
    });
  };

  const updateBeneficio = (index: number, value: string) => {
    setFormData({
      ...formData,
      beneficios: formData.beneficios.map((beneficio, i) => (i === index ? value : beneficio)),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planes</h1>
          <p className="text-muted-foreground">
            Gestiona los planes de membresía
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gradient-bg hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
            <DialogHeader>
              <DialogTitle className="gradient-text">Crear Nuevo Plan</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-[#F8F8F8]">Nombre</Label>
                  <ControlledInput
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del plan"
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
                    step="0.01"
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
                  placeholder="Descripción del plan"
                  rows={3}
                  maxLength={500}
                  showCharCount={true}
                  showWarning={true}
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duracion" className="text-[#F8F8F8]">Duración</Label>
                  <Select
                    value={formData.duracion}
                    onValueChange={(value) => setFormData({ ...formData, duracion: value })}
                  >
                    <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]">
                      <SelectValue placeholder="Seleccionar duración" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-[#1E1E1E]">
                      <SelectItem value="Mensual">Mensual</SelectItem>
                      <SelectItem value="Trimestral">Trimestral</SelectItem>
                      <SelectItem value="Semestral">Semestral</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-[#F8F8F8]">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-[#1E1E1E]">
                      <SelectItem value="STANDARD">Estándar</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beneficios</Label>
                <div className="space-y-2">
                  {formData.beneficios.map((beneficio, index) => (
                    <div key={index} className="flex gap-2">
                      <ControlledInput
                        value={beneficio}
                        onChange={(e) => updateBeneficio(index, e.target.value)}
                        placeholder="Beneficio del plan"
                        maxLength={100}
                        showCharCount={true}
                        showWarning={true}
                        className="flex-1 bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeBeneficio(index)}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addBeneficio}
                    className="w-full border-dashed border-[#1E1E1E] text-[#A0A0A0] hover:border-[#D604E0]/50 hover:text-[#D604E0]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Beneficio
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                  <Label htmlFor="activo" className="text-[#F8F8F8]">Activo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="destacado"
                    checked={formData.destacado}
                    onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                  />
                  <Label htmlFor="destacado" className="text-[#F8F8F8]">Destacado</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orden" className="text-[#F8F8F8]">Orden</Label>
                  <ControlledInput
                    id="orden"
                    type="number"
                    value={formData.orden}
                    onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                    placeholder="0"
                    maxLength={3}
                    showCharCount={true}
                    showWarning={true}
                    className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sedes</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {sedes.map((sede) => (
                      <div key={sede.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`sede-${sede.id}`}
                          checked={formData.sedes.some(s => s.id === sede.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, sedes: [...formData.sedes, sede] });
                            } else {
                              setFormData({ ...formData, sedes: formData.sedes.filter(s => s.id !== sede.id) });
                            }
                          }}
                          className="rounded border-gray-300 bg-[#0A0A0A] text-[#D604E0] focus:ring-[#D604E0]"
                        />
                        <Label htmlFor={`sede-${sede.id}`} className="text-[#F8F8F8] text-sm">{sede.nombre}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white">
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isLoading} className="gradient-bg hover:opacity-90">
                {isLoading ? "Creando..." : "Crear Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de planes */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {planesList.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative rounded-xl overflow-hidden transition-all duration-300 bg-[#1A1A1A] border border-white/10 hover:border-white/20 card-glow-hover`}
          >
            {/* Badge de VIP */}
            {plan.esVip && (
              <div className="absolute top-2 left-2 z-10">
                <span className="px-2 py-1 gradient-bg rounded-full text-white text-xs font-bold flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  VIP
                </span>
              </div>
            )}

            {/* Badge de destacado */}
            {plan.destacado && !plan.esVip && (
              <div className="absolute top-2 right-2 z-10">
                <span className="px-2 py-1 bg-[#040AE0] rounded-full text-white text-xs font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Popular
                </span>
              </div>
            )}

            {/* Contenido */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{plan.nombre}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-2">{plan.descripcion}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#141414] border-[#1E1E1E]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">¿Eliminar plan?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#A0A0A0]">
                          Esta acción no se puede deshacer. Se eliminará permanentemente el plan "{plan.nombre}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-[#1E1E1E] text-[#F8F8F8] hover:bg-[#2A2A2A]">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(plan.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">{formatCurrency(plan.precio)}</span>
                <span className="text-sm text-gray-400">/{plan.duracion}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={plan.esVip ? "gradient-bg text-white" : "bg-[#1E1E1E] text-[#A0A0A0]"}>
                  {plan.tipo}
                </Badge>
                <Badge className={plan.activo ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-red-500/20 border-red-500/50 text-red-400"}>
                  {plan.activo ? "Activo" : "Inactivo"}
                </Badge>
                {plan.destacado && <Badge className="bg-[#040AE0]/20 border-[#040AE0]/50 text-[#040AE0]">Destacado</Badge>}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-300 mb-2">Beneficios:</p>
                <ul className="space-y-1">
                  {plan.beneficios.map((beneficio, i) => (
                    <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                      <span>{beneficio}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-xs text-gray-500">
                Sedes: {plan.sedes.map(s => s.nombre).join(", ")}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Editar Plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre" className="text-[#F8F8F8]">Nombre</Label>
                <ControlledInput
                  id="edit-nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del plan"
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
                  step="0.01"
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
                placeholder="Descripción del plan"
                rows={3}
                maxLength={500}
                showCharCount={true}
                showWarning={true}
                className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duracion" className="text-[#F8F8F8]">Duración</Label>
                <Select
                  value={formData.duracion}
                  onValueChange={(value) => setFormData({ ...formData, duracion: value })}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]">
                    <SelectValue placeholder="Seleccionar duración" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-[#1E1E1E]">
                    <SelectItem value="Mensual">Mensual</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                    <SelectItem value="Semestral">Semestral</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tipo" className="text-[#F8F8F8]">Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-[#1E1E1E]">
                      <SelectItem value="STANDARD">Estándar</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            <div className="space-y-2">
              <Label>Beneficios</Label>
              <div className="space-y-2">
                {formData.beneficios.map((beneficio, index) => (
                  <div key={index} className="flex gap-2">
                    <ControlledInput
                      value={beneficio}
                      onChange={(e) => updateBeneficio(index, e.target.value)}
                      placeholder="Beneficio del plan"
                      maxLength={100}
                      showCharCount={true}
                      showWarning={true}
                      className="flex-1 bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBeneficio(index)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addBeneficio}
                  className="w-full border-dashed border-[#1E1E1E] text-[#A0A0A0] hover:border-[#D604E0]/50 hover:text-[#D604E0]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Beneficio
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="edit-activo" className="text-[#F8F8F8]">Activo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-destacado"
                  checked={formData.destacado}
                  onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                />
                <Label htmlFor="edit-destacado" className="text-[#F8F8F8]">Destacado</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-orden" className="text-[#F8F8F8]">Orden</Label>
                <ControlledInput
                  id="edit-orden"
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                  placeholder="0"
                  maxLength={3}
                  showCharCount={true}
                  showWarning={true}
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
              </div>
              <div className="space-y-2">
                <Label>Sedes</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {sedes.map((sede) => (
                    <div key={sede.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-sede-${sede.id}`}
                        checked={formData.sedes.some(s => s.id === sede.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, sedes: [...formData.sedes, sede] });
                          } else {
                            setFormData({ ...formData, sedes: formData.sedes.filter(s => s.id !== sede.id) });
                          }
                        }}
                        className="rounded border-gray-300 bg-[#0A0A0A] text-[#D604E0] focus:ring-[#D604E0]"
                      />
                      <Label htmlFor={`edit-sede-${sede.id}`} className="text-[#F8F8F8] text-sm">{sede.nombre}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white">
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={isLoading} className="gradient-bg hover:opacity-90">
                {isLoading ? "Actualizando..." : "Actualizar Plan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
