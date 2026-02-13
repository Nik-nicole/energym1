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
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Edit, Trash2, Plus, Star, Clock, DollarSign, MapPin, Check, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Sede {
  id: string;
  nombre: string;
}

interface PlanSede {
  id: string;
  sedeId: string;
  planId: string;
  sede: Sede;
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
  createdAt: Date;
  updatedAt: Date;
  sedes: PlanSede[];
  _count: {
    sedes: number;
  };
}

interface PlanesAdminProps {
  planes: Plan[];
  sedes: Sede[];
}

export function PlanesAdmin({ planes, sedes }: PlanesAdminProps) {
  const [planesList, setPlanesList] = useState<Plan[]>(planes);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBenefits, setShowBenefits] = useState<{ [key: string]: boolean }>({});

  const [formData, setFormData] = useState({
    nombre: "",
    precio: 0,
    descripcion: "",
    beneficios: [""],
    duracion: "",
    tipo: "STANDARD",
    esVip: false,
    activo: true,
    destacado: false,
    orden: 0,
    sedeIds: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      precio: 0,
      descripcion: "",
      beneficios: [""],
      duracion: "",
      tipo: "STANDARD",
      esVip: false,
      activo: true,
      destacado: false,
      orden: 0,
      sedeIds: [],
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
      precio: plan.precio,
      descripcion: plan.descripcion,
      beneficios: plan.beneficios.length > 0 ? plan.beneficios : [""],
      duracion: plan.duracion,
      tipo: plan.tipo,
      esVip: plan.esVip,
      activo: plan.activo,
      destacado: plan.destacado,
      orden: plan.orden,
      sedeIds: plan.sedes.map((ps) => ps.sedeId),
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

  const toggleBenefits = (planId: string) => {
    setShowBenefits(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };

  const addBeneficio = () => {
    setFormData({
      ...formData,
      beneficios: [...formData.beneficios, ""],
    });
  };

  const updateBeneficio = (index: number, value: string) => {
    const newBeneficios = [...formData.beneficios];
    newBeneficios[index] = value;
    setFormData({
      ...formData,
      beneficios: newBeneficios,
    });
  };

  const removeBeneficio = (index: number) => {
    if (formData.beneficios.length > 1) {
      setFormData({
        ...formData,
        beneficios: formData.beneficios.filter((_, i) => i !== index),
      });
    }
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
                    placeholder="0.00"
                    maxLength={10}
                    showCharCount={true}
                    showWarning={true}
                    required={true}
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[#F8F8F8]">Beneficios</Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white text-xs"
                      >
                        Copiar de otro plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#141414] border-[#1E1E1E] text-white max-w-md">
                      <DialogHeader>
                        <DialogTitle>Seleccionar plan para copiar beneficios</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {planes.filter((p: Plan) => p.id !== (formData as any).id).map((plan: Plan) => (
                          <div
                            key={plan.id}
                            className="p-3 border border-[#1E1E1E] rounded-lg cursor-pointer hover:bg-[#1E1E1E] transition-colors"
                            onClick={() => {
                              if (plan.beneficios.length > 0) {
                                setFormData({
                                  ...formData,
                                  beneficios: [...plan.beneficios]
                                });
                                toast.success("Beneficios copiados del plan: " + plan.nombre);
                              } else {
                                toast.error("El plan seleccionado no tiene beneficios");
                              }
                            }}
                          >
                            <div className="font-medium">{plan.nombre}</div>
                            <div className="text-sm text-gray-400">{plan.duracion} - ${plan.precio}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {plan.beneficios.length} beneficios disponibles
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {formData.beneficios.map((beneficio, index) => (
                  <div key={index} className="flex gap-2">
                    <ControlledInput
                      value={beneficio}
                      onChange={(e) => updateBeneficio(index, e.target.value)}
                      placeholder="Beneficio"
                      maxLength={200}
                      showCharCount={true}
                      showWarning={true}
                      className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBeneficio(index)}
                      disabled={formData.beneficios.length === 1}
                      className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white"
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addBeneficio} className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Beneficio
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duracion" className="text-[#F8F8F8]">Duración</Label>
                  <Select
                    value={formData.duracion}
                    onValueChange={(value) => setFormData({ ...formData, duracion: value })}
                  >
                    <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white">
                      <SelectValue placeholder="Seleccionar duración" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141414] border-[#1E1E1E]">
                      <SelectItem value="1 día">1 día</SelectItem>
                      <SelectItem value="15 días">15 días</SelectItem>
                      <SelectItem value="2 meses">2 meses</SelectItem>
                      <SelectItem value="1 mes">1 mes</SelectItem>
                      <SelectItem value="3 meses">3 meses</SelectItem>
                      <SelectItem value="6 meses">6 meses</SelectItem>
                      <SelectItem value="1 año">1 año</SelectItem>
                      <SelectItem value="2 años">2 años</SelectItem>
                      <SelectItem value="Trimestral">Trimestral</SelectItem>
                      <SelectItem value="Semestral">Semestral</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                      <SelectItem value="Ilimitado">Ilimitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orden" className="text-[#F8F8F8]">Orden</Label>
                  <ControlledInput
                    id="orden"
                    type="number"
                    value={formData.orden}
                    onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                    placeholder="Orden de visualización"
                    maxLength={3}
                    showCharCount={true}
                    showWarning={true}
                    className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-[#F8F8F8]">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141414] border-[#1E1E1E]">
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="BASIC">Basic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#F8F8F8]">Sedes</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {sedes.map((sede) => (
                      <div key={sede.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sede-${sede.id}`}
                          checked={formData.sedeIds.includes(sede.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                sedeIds: [...formData.sedeIds, sede.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                sedeIds: formData.sedeIds.filter((id) => id !== sede.id),
                              });
                            }
                          }}
                          className="data-[state=checked]:bg-[#D604E0] data-[state=unchecked]:bg-[#2A2A2A] border-[#1E1E1E]"
                        />
                        <Label htmlFor={`sede-${sede.id}`} className="text-[#F8F8F8]">{sede.nombre}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Switch
                      id="esVip"
                      checked={formData.esVip}
                      onCheckedChange={(checked) => setFormData({ ...formData, esVip: checked })}
                      className="w-11 h-6 data-[state=checked]:bg-[#D604E0] data-[state=unchecked]:bg-[#2A2A2A] border-2 border-[#1E1E1E] transition-colors duration-200"
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-1">
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        formData.esVip ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </div>
                  <Label htmlFor="esVip" className="text-[#F8F8F8]">Plan VIP</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Switch
                      id="destacado"
                      checked={formData.destacado}
                      onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                      className="w-11 h-6 data-[state=checked]:bg-[#D604E0] data-[state=unchecked]:bg-[#2A2A2A] border-2 border-[#1E1E1E] transition-colors duration-200"
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-1">
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        formData.destacado ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </div>
                  <Label htmlFor="destacado" className="text-[#F8F8F8]">Destacado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Switch
                      id="activo"
                      checked={formData.activo}
                      onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                      className="w-11 h-6 data-[state=checked]:bg-[#D604E0] data-[state=unchecked]:bg-[#2A2A2A] border-2 border-[#1E1E1E] transition-colors duration-200"
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-1">
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        formData.activo ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </div>
                  <Label htmlFor="activo" className="text-[#F8F8F8]">Activo</Label>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {planesList.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative rounded-2xl p-6 transition-all duration-300 ${
              plan.esVip
                ? "bg-gradient-to-br from-[#D604E0]/20 to-[#040AE0]/20 border-2 border-[#D604E0]/50 card-glow"
                : "bg-[#141414] border border-white/10 hover:border-white/20"
            } card-glow-hover`}
          >
            {plan.esVip && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gradient-bg rounded-full text-sm font-medium flex items-center gap-1">
                <Crown className="w-4 h-4" />
                VIP
              </div>
            )}
            {plan.destacado && !plan.esVip && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#040AE0] rounded-full text-sm font-medium flex items-center gap-1">
                <Star className="w-4 h-4" />
                Popular
              </div>
            )}

            <div className="flex flex-col items-center gap-2">
              <h3 className={`text-xl font-bold mb-2 ${plan.esVip ? "gradient-text" : "text-white"}`}>
                {plan.nombre}
              </h3>
              <p className="text-gray-400 text-sm mb-4">{plan.descripcion}</p>
              <div className="flex items-end justify-center gap-1">
                <span className={`text-4xl font-bold ${plan.esVip ? "gradient-text" : "text-white"}`}>
                  {new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  }).format(plan.precio)}
                </span>
                <span className="text-gray-400 mb-1">/{plan.duracion}</span>
              </div>
            </div>

            <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleBenefits(plan.id)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

            {showBenefits[plan.id] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <ul className="space-y-3 mb-6">
                  {plan.beneficios.slice(0, 3).map((beneficio, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.esVip ? "text-[#D604E0]" : "text-[#040AE0]"}`} />
                      <span>{beneficio}</span>
                    </li>
                  ))}
                  {plan.beneficios.length > 3 && (
                    <li className="text-gray-400 text-sm text-center">
                      +{plan.beneficios.length - 3} beneficios más...
                    </li>
                  )}
                </ul>
              </motion.div>
            )}

            <button
              onClick={handleSelectPlan}
              className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                isVip
                  ? "gradient-bg hover:opacity-90"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Zap className="w-4 h-4" />
              {session ? "Seleccionar Plan" : "Empezar Ahora"}
            </button>
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
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del plan"
                  maxLength={100}
                  showCharCount={true}
                  showWarning={true}
                  required={true}
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
                  placeholder="0.00"
                  maxLength={10}
                  showCharCount={true}
                  showWarning={true}
                  required={true}
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#F8F8F8]">Beneficios</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white text-xs"
                    >
                      Copiar de otro plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#141414] border-[#1E1E1E] text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle>Seleccionar plan para copiar beneficios</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {planes.filter((p: Plan) => p.id !== (formData as any).id).map((plan: Plan) => (
                        <div
                          key={plan.id}
                          className="p-3 border border-[#1E1E1E] rounded-lg cursor-pointer hover:bg-[#1E1E1E] transition-colors"
                          onClick={() => {
                            if (plan.beneficios.length > 0) {
                              setFormData({
                                ...formData,
                                beneficios: [...plan.beneficios]
                              });
                              toast.success("Beneficios copiados del plan: " + plan.nombre);
                            } else {
                              toast.error("El plan seleccionado no tiene beneficios");
                            }
                          }}
                        >
                          <div className="font-medium">{plan.nombre}</div>
                          <div className="text-sm text-gray-400">{plan.duracion} - ${plan.precio}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {plan.beneficios.length} beneficios disponibles
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {formData.beneficios.map((beneficio, index) => (
                <div key={index} className="flex gap-2">
                  <ControlledInput
                    value={beneficio}
                    onChange={(e) => updateBeneficio(index, e.target.value)}
                    placeholder="Beneficio"
                    maxLength={200}
                    showCharCount={true}
                    showWarning={true}
                    className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeBeneficio(index)}
                    disabled={formData.beneficios.length === 1}
                    className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white"
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addBeneficio} className="border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Beneficio
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duracion" className="text-[#F8F8F8]">Duración</Label>
                <Select
                  value={formData.duracion}
                  onValueChange={(value) => setFormData({ ...formData, duracion: value })}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white">
                    <SelectValue placeholder="Seleccionar duración" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141414] border-[#1E1E1E]">
                    <SelectItem value="1 día">1 día</SelectItem>
                    <SelectItem value="15 días">15 días</SelectItem>
                    <SelectItem value="2 meses">2 meses</SelectItem>
                    <SelectItem value="1 mes">1 mes</SelectItem>
                    <SelectItem value="3 meses">3 meses</SelectItem>
                    <SelectItem value="6 meses">6 meses</SelectItem>
                    <SelectItem value="1 año">1 año</SelectItem>
                    <SelectItem value="2 años">2 años</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                    <SelectItem value="Semestral">Semestral</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                    <SelectItem value="Ilimitado">Ilimitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-orden" className="text-[#F8F8F8]">Orden</Label>
                <ControlledInput
                  id="edit-orden"
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                  placeholder="Orden de visualización"
                  maxLength={3}
                  showCharCount={true}
                  showWarning={true}
                  className="bg-[#0A0A0A] border-[#1E1E1E] text-white placeholder-[#A0A0A0]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tipo" className="text-[#F8F8F8]">Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border-[#1E1E1E] text-white">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141414] border-[#1E1E1E]">
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="BASIC">Basic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#F8F8F8]">Sedes</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {sedes.map((sede) => (
                    <div key={sede.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-sede-${sede.id}`}
                        checked={formData.sedeIds.includes(sede.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              sedeIds: [...formData.sedeIds, sede.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              sedeIds: formData.sedeIds.filter((id) => id !== sede.id),
                            });
                          }
                        }}
                        className="data-[state=checked]:bg-[#D604E0] data-[state=unchecked]:bg-[#2A2A2A] border-[#1E1E1E]"
                      />
                      <Label htmlFor={`edit-sede-${sede.id}`} className="text-[#F8F8F8]">{sede.nombre}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Switch
                    id="edit-esVip"
                    checked={formData.esVip}
                    onCheckedChange={(checked) => setFormData({ ...formData, esVip: checked })}
                    className="w-11 h-6 data-[state=checked]:bg-[#D604E0] data-[state=unchecked]:bg-[#2A2A2A] border-2 border-[#1E1E1E] transition-colors duration-200"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-1">
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      formData.esVip ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </div>
                <Label htmlFor="edit-esVip" className="text-[#F8F8F8]">Plan VIP</Label>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Switch
                    id="edit-destacado"
                    checked={formData.destacado}
                    onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                    className="w-11 h-6 data-[state=checked]:bg-[#D604E0] data-[state=unchecked]:bg-[#2A2A2A] border-2 border-[#1E1E1E] transition-colors duration-200"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-1">
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      formData.destacado ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </div>
                <Label htmlFor="edit-destacado" className="text-[#F8F8F8]">Destacado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Switch
                    id="edit-activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                    className="w-11 h-6 data-[state=checked]:bg-[#D604E0] data-[state=unchecked]:bg-[#2A2A2A] border-2 border-[#1E1E1E] transition-colors duration-200"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-1">
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      formData.activo ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </div>
                <Label htmlFor="edit-activo" className="text-[#F8F8F8]">Activo</Label>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
