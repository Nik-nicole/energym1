"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Edit, Trash2, Plus, Star, Clock, DollarSign, MapPin } from "lucide-react";
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
  createdAt: string;
  updatedAt: string;
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
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Plan</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del plan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del plan"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Beneficios</Label>
                {formData.beneficios.map((beneficio, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={beneficio}
                      onChange={(e) => updateBeneficio(index, e.target.value)}
                      placeholder="Beneficio"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBeneficio(index)}
                      disabled={formData.beneficios.length === 1}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addBeneficio}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Beneficio
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración</Label>
                  <Input
                    id="duracion"
                    value={formData.duracion}
                    onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                    placeholder="Ej: 1 mes, 3 meses, 1 año"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orden">Orden</Label>
                  <Input
                    id="orden"
                    type="number"
                    value={formData.orden}
                    onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                    placeholder="Orden de visualización"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="BASIC">Basic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sedes</Label>
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
                        />
                        <Label htmlFor={`sede-${sede.id}`}>{sede.nombre}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="esVip"
                    checked={formData.esVip}
                    onCheckedChange={(checked) => setFormData({ ...formData, esVip: checked })}
                  />
                  <Label htmlFor="esVip">Plan VIP</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="destacado"
                    checked={formData.destacado}
                    onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                  />
                  <Label htmlFor="destacado">Destacado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                  <Label htmlFor="activo">Activo</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {planesList.map((plan) => (
          <Card key={plan.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    {plan.nombre}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {plan.esVip && <Badge variant="default">VIP</Badge>}
                    {plan.destacado && <Badge variant="secondary">Destacado</Badge>}
                    <Badge variant={plan.activo ? "default" : "secondary"}>
                      {plan.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ${plan.precio.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {plan.duracion}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {plan.descripcion}
                </p>
                {plan.beneficios.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Beneficios:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {plan.beneficios.slice(0, 3).map((beneficio, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                          {beneficio}
                        </li>
                      ))}
                      {plan.beneficios.length > 3 && (
                        <li className="text-xs text-muted-foreground">
                          +{plan.beneficios.length - 3} más...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{plan._count.sedes} sedes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(plan)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar plan?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el plan "{plan.nombre}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(plan.id)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre</Label>
                <Input
                  id="edit-nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del plan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-precio">Precio</Label>
                <Input
                  id="edit-precio"
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-descripcion">Descripción</Label>
              <Textarea
                id="edit-descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del plan"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Beneficios</Label>
              {formData.beneficios.map((beneficio, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={beneficio}
                    onChange={(e) => updateBeneficio(index, e.target.value)}
                    placeholder="Beneficio"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeBeneficio(index)}
                    disabled={formData.beneficios.length === 1}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addBeneficio}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Beneficio
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duracion">Duración</Label>
                <Input
                  id="edit-duracion"
                  value={formData.duracion}
                  onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                  placeholder="Ej: 1 mes, 3 meses, 1 año"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-orden">Orden</Label>
                <Input
                  id="edit-orden"
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                  placeholder="Orden de visualización"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tipo">Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="BASIC">Basic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sedes</Label>
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
                      />
                      <Label htmlFor={`edit-sede-${sede.id}`}>{sede.nombre}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-esVip"
                  checked={formData.esVip}
                  onCheckedChange={(checked) => setFormData({ ...formData, esVip: checked })}
                />
                <Label htmlFor="edit-esVip">Plan VIP</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-destacado"
                  checked={formData.destacado}
                  onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                />
                <Label htmlFor="edit-destacado">Destacado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="edit-activo">Activo</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Actualizar Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
