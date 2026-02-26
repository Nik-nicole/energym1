"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image,
  Eye,
  Save,
  Send,
  Plus,
  Trash2,
  Palette,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
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

interface EnhancedNoticiaFormProps {
  noticia?: Noticia | null;
  sedes: Sede[];
  onSubmit: (data: NoticiaFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function EnhancedNoticiaForm({ 
  noticia, 
  sedes, 
  onSubmit, 
  onCancel, 
  isLoading 
}: EnhancedNoticiaFormProps) {
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

  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize form with noticia data if editing
  useEffect(() => {
    if (noticia) {
      setFormData({
        titulo: noticia.titulo,
        resumen: noticia.resumen || "",
        contenido: [],
        imagen: noticia.imagen || "",
        esPromocion: noticia.esPromocion,
        fechaInicio: noticia.fechaInicio ? new Date(noticia.fechaInicio).toISOString().split('T')[0] : "",
        fechaFin: noticia.fechaFin ? new Date(noticia.fechaFin).toISOString().split('T')[0] : "",
        sedeId: noticia.sedeId || "",
        activo: noticia.activo,
        destacado: noticia.destacado,
        imagenPosicion: "banner"
      });
      
      // Parse content blocks if they exist
      let existingContent: ContentBlock[] = [];
      try {
        // Handle different content formats
        if (Array.isArray(noticia.contenido)) {
          existingContent = noticia.contenido;
        } else if (typeof noticia.contenido === 'string') {
          // Try to parse as JSON first
          try {
            existingContent = JSON.parse(noticia.contenido);
          } catch {
            // If parsing fails, create a paragraph block with the string content
            existingContent = [{
              id: Date.now().toString(),
              type: 'parrafo',
              content: noticia.contenido,
              estilo: {
                alineacion: 'left',
                color: '#000000',
                tamaño: 'mediano'
              }
            }];
          }
        }
      } catch (error) {
        console.error('Error parsing content blocks:', error);
        existingContent = [];
      }
      
      setContentBlocks(existingContent);
    }
  }, [noticia]);

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

  // Image upload function
  const handleImageUpload = async (file: File, isMainImage: boolean = false) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const result = await response.json();
      
      if (isMainImage) {
        setFormData(prev => ({ ...prev, imagen: result.url }));
      }
      
      return result.url;
    } catch (error) {
      toast.error('Error al subir la imagen');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.titulo.trim()) {
      toast.error("El título es requerido");
      return;
    }

    const submitData = {
      ...formData,
      contenido: contentBlocks
    };

    onSubmit(submitData);
  };

  const renderPreview = () => {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          {formData.titulo || "Título de la noticia"}
        </h1>

        {/* Summary */}
        {formData.resumen && (
          <div className="text-gray-300 text-lg mb-6 italic">
            {formData.resumen}
          </div>
        )}

        {/* Main Image */}
        {formData.imagen && (
          <div className="mb-6">
            <img 
              src={formData.imagen} 
              alt={formData.titulo}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Content Blocks */}
        <div className="space-y-4">
          {contentBlocks.map((block) => {
            const alignmentClass = {
              'left': 'text-left',
              'center': 'text-center',
              'right': 'text-right',
              'justify': 'text-justify'
            }[block.estilo.alineacion] || 'text-left';

            const sizeClass = {
              'pequeño': 'text-sm',
              'mediano': 'text-base',
              'grande': 'text-xl'
            }[block.estilo.tamaño] || 'text-base';

            if (block.type === 'titulo') {
              return (
                <h2 key={block.id} className={`text-2xl font-bold text-white ${alignmentClass} ${sizeClass}`}>
                  {block.content || "Título"}
                </h2>
              );
            }

            if (block.type === 'subtitulo') {
              return (
                <h3 key={block.id} className={`text-xl font-semibold text-gray-200 ${alignmentClass} ${sizeClass}`}>
                  {block.content || "Subtítulo"}
                </h3>
              );
            }

            if (block.type === 'parrafo') {
              return (
                <p key={block.id} className={`text-gray-300 leading-relaxed ${alignmentClass} ${sizeClass}`}>
                  {block.content || "Párrafo de texto..."}
                </p>
              );
            }

            if (block.type === 'imagen' && block.imageSettings?.url) {
              return (
                <div key={block.id} className={`mb-4 ${alignmentClass}`}>
                  <img 
                    src={block.imageSettings.url} 
                    alt={block.imageSettings.alt || "Imagen"}
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Metadata */}
        <div className="mt-8 pt-4 border-t border-gray-700">
          <div className="flex flex-wrap gap-2">
            {formData.esPromocion && (
              <Badge className="bg-[#D604E0] text-white">Promoción</Badge>
            )}
            {formData.destacado && (
              <Badge className="bg-yellow-500 text-white">Destacado</Badge>
            )}
            {formData.sedeId && (
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {sedes.find(s => s.id === formData.sedeId)?.nombre}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">
          {noticia ? "Editar Noticia" : "Crear Nueva Noticia"}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Eye className="w-4 h-4 mr-2" />
            Vista Previa
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-[#D604E0] hover:bg-[#D604E0]/90 text-white"
          >
            {isLoading ? "Guardando..." : (
              <>
                {noticia ? <Save className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                {noticia ? "Actualizar" : "Publicar"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Title */}
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Type className="w-5 h-5" />
                Título de la Noticia *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Crea un título atractivo para tu noticia"
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white placeholder-gray-500"
              />
              <p className="text-sm text-gray-400 mt-2">
                Ej: "Nuevos horarios de verano en todas nuestras sedes"
              </p>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-white">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.resumen}
                onChange={(e) => setFormData({ ...formData, resumen: e.target.value })}
                placeholder="Breve resumen de la noticia (opcional)"
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white placeholder-gray-500 min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Content Blocks */}
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-white">Contenido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Content Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addContentBlock('titulo')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Type className="w-4 h-4 mr-2" />
                  Título
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addContentBlock('subtitulo')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Type className="w-4 h-4 mr-2" />
                  Subtítulo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addContentBlock('parrafo')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <AlignLeft className="w-4 h-4 mr-2" />
                  Párrafo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addContentBlock('imagen')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Imagen
                </Button>
              </div>

              {/* Content Blocks List */}
              <div className="space-y-3">
                {contentBlocks.map((block, index) => (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#2A2A2A] border-[#3A3A3A] rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          {block.type === 'titulo' && 'Título'}
                          {block.type === 'subtitulo' && 'Subtítulo'}
                          {block.type === 'parrafo' && 'Párrafo'}
                          {block.type === 'imagen' && 'Imagen'}
                        </Badge>
                        <span className="text-sm text-gray-400">#{index + 1}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeContentBlock(block.id)}
                        className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {block.type === 'imagen' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id={`image-upload-${block.id}`}
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, false).then((url) => {
                                  updateContentBlock(block.id, 'imageSettings', {
                                    ...block.imageSettings,
                                    url: url
                                  });
                                });
                              }
                            }}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => document.getElementById(`image-upload-${block.id}`)?.click()}
                            disabled={isUploading}
                            className="border-[#D604E0] text-[#D604E0] hover:bg-[#D604E0] hover:text-white"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            {isUploading ? 'Subiendo...' : 'Subir'}
                          </Button>
                        </div>
                        <Input
                          value={block.imageSettings?.alt || ""}
                          onChange={(e) => updateContentBlock(block.id, 'imageSettings', {
                            ...block.imageSettings,
                            alt: e.target.value
                          })}
                          placeholder="Texto alternativo (alt)"
                          className="bg-[#1A1A1A] border-[#3A3A3A] text-white placeholder-gray-500"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Textarea
                          value={block.content}
                          onChange={(e) => updateContentBlock(block.id, 'content', e.target.value)}
                          placeholder={
                            block.type === 'titulo' ? "Ingresa el título..." :
                            block.type === 'subtitulo' ? "Ingresa el subtítulo..." :
                            "Ingresa el párrafo..."
                          }
                          className="bg-[#1A1A1A] border-[#3A3A3A] text-white placeholder-gray-500 min-h-[80px]"
                        />

                        {/* Text Formatting Options */}
                        <div className="flex flex-wrap gap-2">
                          <Select
                            value={block.estilo.alineacion}
                            onValueChange={(value) => updateContentBlock(block.id, 'estilo', {
                              ...block.estilo,
                              alineacion: value as any
                            })}
                          >
                            <SelectTrigger className="w-32 bg-[#1A1A1A] border-[#3A3A3A] text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1A1A1A] border-[#3A3A3A]">
                              <SelectItem value="left">Izquierda</SelectItem>
                              <SelectItem value="center">Centro</SelectItem>
                              <SelectItem value="right">Derecha</SelectItem>
                              <SelectItem value="justify">Justificado</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            value={block.estilo.tamaño}
                            onValueChange={(value) => updateContentBlock(block.id, 'estilo', {
                              ...block.estilo,
                              tamaño: value as any
                            })}
                          >
                            <SelectTrigger className="w-32 bg-[#1A1A1A] border-[#3A3A3A] text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1A1A1A] border-[#3A3A3A]">
                              <SelectItem value="pequeño">Pequeño</SelectItem>
                              <SelectItem value="mediano">Mediano</SelectItem>
                              <SelectItem value="grande">Grande</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          {/* Main Image */}
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-white">Imagen Principal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="main-image-upload"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file, true);
                    }
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('main-image-upload')?.click()}
                  disabled={isUploading}
                  className="border-[#D604E0] text-[#D604E0] hover:bg-[#D604E0] hover:text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Subiendo...' : 'Subir Imagen'}
                </Button>
              </div>
              {formData.imagen && (
                <div className="mt-3">
                  <img 
                    src={formData.imagen} 
                    alt="Preview"
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-white">Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sede */}
              <div>
                <Label className="text-gray-300 text-sm">Sede (opcional)</Label>
                <Select
                  value={formData.sedeId || "all"}
                  onValueChange={(value) => setFormData({ ...formData, sedeId: value === "all" ? "" : value })}
                >
                  <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                    <SelectValue placeholder="Seleccionar sede" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                    <SelectItem value="all">Todas las sedes</SelectItem>
                    {sedes.map((sede) => (
                      <SelectItem key={sede.id} value={sede.id}>
                        {sede.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              {/* Toggle Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Es Promoción</Label>
                    <p className="text-xs text-gray-500">Marcar como contenido promocional</p>
                  </div>
                  <Switch
                    checked={formData.esPromocion}
                    onCheckedChange={(checked) => setFormData({ ...formData, esPromocion: checked })}
                    className="data-[state=checked]:bg-[#D604E0] data-[state=unchecked]:bg-gray-600 [&>span]:bg-white"
                  />
                </div>

                {formData.esPromocion && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pl-4 border-l-2 border-[#D604E0]/30"
                  >
                    <Label className="text-gray-300 text-sm">Fechas de Promoción</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-gray-400 text-xs">Inicio</Label>
                        <Input
                          type="date"
                          value={formData.fechaInicio}
                          onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                          className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400 text-xs">Fin</Label>
                        <Input
                          type="date"
                          value={formData.fechaFin}
                          onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                          className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Destacado</Label>
                    <p className="text-xs text-gray-500">Mostrar en sección destacada</p>
                  </div>
                  <Switch
                    checked={formData.destacado}
                    onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                    className="data-[state=checked]:bg-[#D604E0] data-[state=unchecked]:bg-gray-600 [&>span]:bg-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Activo</Label>
                    <p className="text-xs text-gray-500">Publicar inmediatamente</p>
                  </div>
                  <Switch
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                    className="data-[state=checked]:bg-[#D604E0] data-[state=unchecked]:bg-gray-600 [&>span]:bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
          <DialogHeader>
            <DialogTitle className="text-white">Vista Previa de la Noticia</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
