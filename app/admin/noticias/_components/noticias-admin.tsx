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
import { Newspaper, Edit, Trash2, Plus, Calendar, MapPin, Star } from "lucide-react";
import { toast } from "sonner";

interface Sede {
  id: string;
  nombre: string;
}

interface Noticia {
  id: string;
  titulo: string;
  contenido: string;
  resumen: string | null;
  imagen: string | null;
  sedeId: string | null;
  sede: Sede | null;
  esPromocion: boolean;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  activo: boolean;
  destacado: boolean;
  fechaPublicacion: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface NoticiasAdminProps {
  noticias: Noticia[];
  sedes: Sede[];
}

export function NoticiasAdmin({ noticias, sedes }: NoticiasAdminProps) {
  const [noticiasList, setNoticiasList] = useState<Noticia[]>(noticias);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    contenido: "",
    resumen: "",
    imagen: "",
    sedeId: "",
    esPromocion: false,
    fechaInicio: "",
    fechaFin: "",
    activo: true,
    destacado: false,
  });

  const resetForm = () => {
    setFormData({
      titulo: "",
      contenido: "",
      resumen: "",
      imagen: "",
      sedeId: "",
      esPromocion: false,
      fechaInicio: "",
      fechaFin: "",
      activo: true,
      destacado: false,
    });
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/noticias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error al crear noticia");

      const newNoticia = await response.json();
      setNoticiasList([...noticiasList, newNoticia]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Noticia creada exitosamente");
    } catch (error) {
      toast.error("Error al crear noticia");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (noticia: Noticia) => {
    setEditingNoticia(noticia);
    setFormData({
      titulo: noticia.titulo,
      contenido: noticia.contenido,
      resumen: noticia.resumen || "",
      imagen: noticia.imagen || "",
      sedeId: noticia.sedeId || "",
      esPromocion: noticia.esPromocion,
      fechaInicio: noticia.fechaInicio ? noticia.fechaInicio.toISOString().split('T')[0] : "",
      fechaFin: noticia.fechaFin ? noticia.fechaFin.toISOString().split('T')[0] : "",
      activo: noticia.activo,
      destacado: noticia.destacado,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingNoticia) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/noticias/${editingNoticia.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error al actualizar noticia");

      const updatedNoticia = await response.json();
      setNoticiasList(noticiasList.map((n) => (n.id === updatedNoticia.id ? updatedNoticia : n)));
      setIsEditDialogOpen(false);
      setEditingNoticia(null);
      resetForm();
      toast.success("Noticia actualizada exitosamente");
    } catch (error) {
      toast.error("Error al actualizar noticia");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/noticias/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar noticia");

      setNoticiasList(noticiasList.filter((n) => n.id !== id));
      toast.success("Noticia eliminada exitosamente");
    } catch (error) {
      toast.error("Error al eliminar noticia");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Noticias</h1>
          <p className="text-muted-foreground">
            Gestiona las noticias y promociones
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Noticia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Noticia</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Título de la noticia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resumen">Resumen</Label>
                <Textarea
                  id="resumen"
                  value={formData.resumen}
                  onChange={(e) => setFormData({ ...formData, resumen: e.target.value })}
                  placeholder="Breve resumen (opcional)"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contenido">Contenido</Label>
                <Textarea
                  id="contenido"
                  value={formData.contenido}
                  onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                  placeholder="Contenido completo de la noticia"
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imagen">URL de Imagen</Label>
                <Input
                  id="imagen"
                  value={formData.imagen}
                  onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                  placeholder="URL de la imagen (opcional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sedeId">Sede (opcional)</Label>
                  <Select
                    value={formData.sedeId}
                    onValueChange={(value) => setFormData({ ...formData, sedeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sede" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas las sedes</SelectItem>
                      {sedes.map((sede) => (
                        <SelectItem key={sede.id} value={sede.id}>
                          {sede.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="activo"
                        checked={formData.activo}
                        onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                      />
                      <Label htmlFor="activo">Activa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="destacado"
                        checked={formData.destacado}
                        onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                      />
                      <Label htmlFor="destacado">Destacada</Label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="esPromocion"
                  checked={formData.esPromocion}
                  onCheckedChange={(checked) => setFormData({ ...formData, esPromocion: checked })}
                />
                <Label htmlFor="esPromocion">Es promoción</Label>
              </div>
              {formData.esPromocion && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaInicio">Fecha de inicio</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaFin">Fecha de fin</Label>
                    <Input
                      id="fechaFin"
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Noticia"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {noticiasList.map((noticia) => (
          <Card key={noticia.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-pink-600" />
                    {noticia.titulo}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {noticia.esPromocion && <Badge variant="default">Promoción</Badge>}
                    {noticia.destacado && <Badge variant="secondary">Destacada</Badge>}
                    <Badge variant={noticia.activo ? "default" : "secondary"}>
                      {noticia.activo ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {noticia.resumen && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {noticia.resumen}
                  </p>
                )}
                {noticia.imagen && (
                  <div className="w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={noticia.imagen}
                      alt={noticia.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(noticia.fechaPublicacion).toLocaleDateString()}</span>
                  </div>
                  {noticia.sede && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{noticia.sede.nombre}</span>
                    </div>
                  )}
                </div>
                {noticia.esPromocion && noticia.fechaInicio && noticia.fechaFin && (
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    <div className="font-medium">Vigencia:</div>
                    <div>
                      {new Date(noticia.fechaInicio).toLocaleDateString()} -{" "}
                      {new Date(noticia.fechaFin).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(noticia)}
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
                      <AlertDialogTitle>¿Eliminar noticia?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente la noticia "{noticia.titulo}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(noticia.id)}>
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
            <DialogTitle>Editar Noticia</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-titulo">Título</Label>
              <Input
                id="edit-titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título de la noticia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-resumen">Resumen</Label>
              <Textarea
                id="edit-resumen"
                value={formData.resumen}
                onChange={(e) => setFormData({ ...formData, resumen: e.target.value })}
                placeholder="Breve resumen (opcional)"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contenido">Contenido</Label>
              <Textarea
                id="edit-contenido"
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                placeholder="Contenido completo de la noticia"
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-imagen">URL de Imagen</Label>
              <Input
                id="edit-imagen"
                value={formData.imagen}
                onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                placeholder="URL de la imagen (opcional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sedeId">Sede (opcional)</Label>
                <Select
                  value={formData.sedeId}
                  onValueChange={(value) => setFormData({ ...formData, sedeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sede" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las sedes</SelectItem>
                    {sedes.map((sede) => (
                      <SelectItem key={sede.id} value={sede.id}>
                        {sede.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-activo"
                      checked={formData.activo}
                      onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                    />
                    <Label htmlFor="edit-activo">Activa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-destacado"
                      checked={formData.destacado}
                      onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                    />
                    <Label htmlFor="edit-destacado">Destacada</Label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-esPromocion"
                checked={formData.esPromocion}
                onCheckedChange={(checked) => setFormData({ ...formData, esPromocion: checked })}
              />
              <Label htmlFor="edit-esPromocion">Es promoción</Label>
            </div>
            {formData.esPromocion && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-fechaInicio">Fecha de inicio</Label>
                  <Input
                    id="edit-fechaInicio"
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-fechaFin">Fecha de fin</Label>
                  <Input
                    id="edit-fechaFin"
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Actualizar Noticia"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
