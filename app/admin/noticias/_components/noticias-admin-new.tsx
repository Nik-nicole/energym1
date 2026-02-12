"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { EnhancedNoticiaForm } from "@/components/admin/enhanced-noticia-form";
import { NoticiaFormData } from "@/types/noticia-editor";

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = (noticia: Noticia) => {
    setEditingNoticia(noticia);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (data: NoticiaFormData) => {
    if (!editingNoticia) return;

    setIsLoading(true);
    try {
      let imageUrl = data.imagen;

      const response = await fetch(`/api/admin/noticias/${editingNoticia.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, imagen: imageUrl }),
      });

      if (!response.ok) throw new Error("Error al actualizar noticia");

      const updatedNoticia = await response.json();
      setNoticiasList(noticiasList.map((n) => (n.id === updatedNoticia.id ? updatedNoticia : n)));
      setIsEditDialogOpen(false);
      setEditingNoticia(null);
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || "Error al eliminar noticia");
      }

      setNoticiasList(noticiasList.filter((n) => n.id !== id));
      toast.success("Noticia eliminada exitosamente");
    } catch (error) {
      console.error("Error al eliminar noticia:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar noticia";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Gestión de Noticias</h1>
      </div>

      {/* Noticias Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {noticiasList.map((noticia) => (
          <motion.div
            key={noticia.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5 }}
            className="group"
          >
            <Card className="bg-[#141414] border-[#1E1E1E] hover:border-[#D604E0]/50 transition-all duration-300 overflow-hidden h-full flex flex-col">
              {/* Imagen */}
              {noticia.imagen && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={noticia.imagen}
                    alt={noticia.titulo}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}

              <CardContent className="p-6 flex flex-col flex-grow">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {noticia.esPromocion && (
                    <Badge className="bg-[#D604E0] text-white hover:bg-[#D604E0]/80">
                      Promoción
                    </Badge>
                  )}
                  {noticia.destacado && (
                    <Badge className="bg-[#040AE0] text-white hover:bg-[#040AE0]/80">
                      Destacado
                    </Badge>
                  )}
                  {noticia.sede && (
                    <Badge variant="outline" className="border-[#1E1E1E] text-[#F8F8F8]">
                      {noticia.sede.nombre}
                    </Badge>
                  )}
                </div>

                {/* Título */}
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight">
                  {noticia.titulo}
                </h3>

                {/* Descripción */}
                <p className="text-sm text-gray-400 line-clamp-3 mb-4 flex-grow leading-relaxed">
                  {noticia.resumen || noticia.contenido}
                </p>

                {/* Espacio para acciones futuras si es necesario */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(noticia)}
                    className="h-8 w-8 p-0 text-[#A0A0A0] hover:text-white hover:bg-white/10 rounded-full"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#141414] border-[#1E1E1E]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">
                          ¿Eliminar noticia?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[#A0A0A0]">
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-[#1E1E1E] text-[#F8F8F8] hover:bg-[#2A2A2A]">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(noticia.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Editar Noticia</DialogTitle>
          </DialogHeader>
          
          <EnhancedNoticiaForm
            noticia={editingNoticia}
            sedes={sedes}
            onSubmit={handleUpdate}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingNoticia(null);
            }}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
