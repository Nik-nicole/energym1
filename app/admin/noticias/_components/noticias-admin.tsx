"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomSwitch } from "@/components/ui/custom-switch";
import { ControlledInput } from "@/components/ui/controlled-input";
import { ControlledTextarea } from "@/components/ui/controlled-textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Edit, Trash2, Plus, Upload, Image as ImageIcon, X, Heart, MessageCircle, Share2, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Image, Palette, Minus, Eye, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { EnhancedNoticiaForm } from "@/components/admin/enhanced-noticia-form";
import { NoticiaFormData, ContentBlock } from "@/types/noticia-editor";

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
  const [imagenFile, setImagenFile] = useState<File | null>(null);

  // Form data state
  const [formData, setFormData] = useState<NoticiaFormData>({
    titulo: "",
    resumen: "",
    contenido: [],
    imagen: "",
    esPromocion: false,
    fechaInicio: "",
    fechaFin: "",
    sedeId: "",
    activo: true,
    destacado: false,
    imagenPosicion: "banner"
  });

  // Content blocks state
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  // Reset form function
  const resetForm = () => {
    setFormData({
      titulo: "",
      resumen: "",
      contenido: [],
      imagen: "",
      esPromocion: false,
      fechaInicio: "",
      fechaFin: "",
      sedeId: "",
      activo: true,
      destacado: false,
      imagenPosicion: "banner"
    });
    setContentBlocks([]);
    setImagenFile(null);
  };

  // Content block functions
  const addContentBlock = (type: 'titulo' | 'subtitulo' | 'parrafo' | 'imagen') => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: "",
      estilo: {
        alineacion: 'left',
        color: '#000000',
        tamaño: 'mediano'
      },
      ...(type === 'imagen' && {
        imageSettings: {
          position: 'izquierda',
          url: "",
          alt: "",
          posicion: 'izquierda'
        }
      })
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const removeContentBlock = (id: string) => {
    setContentBlocks(contentBlocks.filter(block => block.id !== id));
  };

  const updateContentBlock = (id: string, field: string, value: any) => {
    setContentBlocks(contentBlocks.map(block => 
      block.id === id ? { ...block, [field]: value } : block
    ));
  };

  // Create noticia function
  const handleCreate = async (data: NoticiaFormData) => {
    setIsLoading(true);
    try {
      let imageUrl = data.imagen;

      // Upload image if exists
      if (imagenFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", imagenFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          imageUrl = uploadResult.url;
        }
      }

      const response = await fetch("/api/admin/noticias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          ...data, 
          imagen: imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || "Error al crear noticia");
      }

      const newNoticia = await response.json();
      setNoticiasList([newNoticia, ...noticiasList]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Noticia creada exitosamente");
    } catch (error) {
      console.error("Error creating noticia:", error);
      toast.error("Error al crear noticia", {
        description: error instanceof Error ? error.message : "Verifica los datos e intenta nuevamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const updatedNoticia = await response.json();
      setNoticiasList(noticiasList.map((n) => (n.id === updatedNoticia.id ? updatedNoticia : n)));
      setIsEditDialogOpen(false);
      setEditingNoticia(null);
      toast.success("Noticia actualizada exitosamente");
    } catch (error) {
      console.error("Error updating noticia:", error);
      toast.error("Error al actualizar noticia", {
        description: error instanceof Error ? error.message : "Verifica los datos e intenta nuevamente",
      });
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Noticias</h1>
          <p className="text-[#A0A0A0]">
            Gestiona las noticias y promociones
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          if(!open) resetForm();
          setIsCreateDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gradient-bg hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Noticia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
            <DialogHeader>
              <DialogTitle className="gradient-text">Crear Nueva Noticia</DialogTitle>
              <DialogDescription className="text-[#A0A0A0]">
                Completa los campos para crear una nueva noticia o promoción.
              </DialogDescription>
            </DialogHeader>
            
            <EnhancedNoticiaForm
              sedes={sedes}
              onSubmit={handleCreate}
              onCancel={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
            <DialogHeader>
              <DialogTitle className="gradient-text">Editar Noticia</DialogTitle>
              <DialogDescription className="text-[#A0A0A0]">
                Modifica los campos de la noticia existente.
              </DialogDescription>
            </DialogHeader>
            {editingNoticia && (
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
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Noticias List - Diseño Horizontal (2-3 por fila) */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {noticiasList.map((noticia) => (
          <Card key={noticia.id} className="bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#D604E0]/50 transition-all duration-300 overflow-hidden rounded-2xl">
            <div className="flex flex-col sm:flex-row">
              {/* Imagen Izquierda (40%) */}
              <div className="w-full sm:w-2/5 relative p-4 flex-shrink-0">
                <div className="h-48 sm:h-full w-full rounded-xl overflow-hidden relative bg-[#0A0A0A] shadow-inner">
                  {noticia.imagen ? (
                    <img
                      src={noticia.imagen}
                      alt={noticia.titulo}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1E1E1E] to-[#0A0A0A]">
                      <ImageIcon className="w-12 h-12 text-[#333]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Contenido Derecha (60%) */}
              <div className="w-full sm:w-3/5 p-6 flex flex-col">
                {/* Badge de sede arriba derecha */}
                <div className="flex justify-end mb-3">
                  <span className="text-xs font-semibold tracking-wider text-[#D604E0] bg-[#D604E0]/10 px-3 py-1 rounded-full border border-[#D604E0]/20 uppercase">
                    {noticia.sede?.nombre || "General"}
                  </span>
                </div>

                {/* Título */}
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                  {noticia.esPromocion ? 'NUEVA SEDE' : noticia.titulo}
                </h3>

                {/* Descripción */}
                <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-grow">
                  {noticia.esPromocion ? 'Agregamos una nueva sede' : noticia.resumen || 'Sin descripción'}
                </p>

                {/* Iconos y fecha */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                  <div className="flex gap-5 text-gray-500">
                    <MessageCircle className="w-5 h-5" />
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {new Date(noticia.fechaPublicacion).toLocaleDateString('es-CO', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(noticia)}
                    className="flex-1 border-[#D604E0]/50 text-[#D604E0] hover:bg-[#D604E0] hover:text-white transition-all duration-200"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(noticia.id)}
                    className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


