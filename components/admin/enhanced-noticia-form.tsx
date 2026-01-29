"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CustomSwitch } from "@/components/ui/custom-switch"
import { ControlledInput } from "@/components/ui/controlled-input"
import { ControlledTextarea } from "@/components/ui/controlled-textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Plus,
  Eye,
  Edit3,
  Type,
  Image as ImageIcon,
  Upload,
  X
} from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

import { ContentBlockEditor } from "@/components/admin/content-block-editor"
import { NoticiaPreview } from "@/components/admin/noticia-preview"
import { ContentBlock, NoticiaFormData } from "@/types/noticia-editor"

interface Sede {
  id: string
  nombre: string
}

interface EnhancedNoticiaFormProps {
  noticia?: any
  sedes: Sede[]
  onSubmit: (data: NoticiaFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function EnhancedNoticiaForm({ 
  noticia, 
  sedes, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: EnhancedNoticiaFormProps) {
  const [activeTab, setActiveTab] = useState('edit')
  const [formData, setFormData] = useState<NoticiaFormData>({
    titulo: noticia?.titulo || '',
    resumen: noticia?.resumen || '',
    imagen: noticia?.imagen || '',
    esPromocion: noticia?.esPromocion || false,
    fechaInicio: noticia?.fechaInicio ? new Date(noticia.fechaInicio).toISOString().split('T')[0] : '',
    fechaFin: noticia?.fechaFin ? new Date(noticia.fechaFin).toISOString().split('T')[0] : '',
    sedeId: noticia?.sedeId || '',
    contenido: noticia?.contenido ? parseContenido(noticia.contenido) : [
      {
        id: '1',
        type: 'text',
        content: '',
        alignment: 'left',
        color: '#ffffff'
      }
    ]
  })

  function parseContenido(contenido: string): ContentBlock[] {
    // Parse existing HTML content to blocks (simplified version)
    return [
      {
        id: '1',
        type: 'text',
        content: contenido,
        alignment: 'left',
        color: '#ffffff'
      }
    ]
  }

  const addContentBlock = (type: 'text' | 'subtitle' | 'image') => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: '',
      alignment: 'left',
      color: '#ffffff',
      ...(type === 'subtitle' && { fontSize: 'medium' }),
      ...(type === 'image' && { 
        imageSettings: {
          position: 'center',
          url: '',
          alt: ''
        }
      })
    }

    setFormData(prev => ({
      ...prev,
      contenido: [...prev.contenido, newBlock]
    }))
  }

  const updateContentBlock = (index: number, block: ContentBlock) => {
    setFormData(prev => ({
      ...prev,
      contenido: prev.contenido.map((b, i) => i === index ? block : b)
    }))
  }

  const deleteContentBlock = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contenido: prev.contenido.filter((_, i) => i !== index)
    }))
  }

  const generateHTMLContent = (): string => {
    return formData.contenido.map(block => {
      switch (block.type) {
        case 'subtitle':
          return `<h2 style="text-align: ${block.alignment}; color: ${block.color || '#ffffff'}; font-size: ${block.fontSize === 'large' ? '2rem' : block.fontSize === 'small' ? '1.5rem' : '1.8rem'};">${block.content}</h2>`
        case 'text':
          return `<div style="text-align: ${block.alignment}; color: ${block.color || '#ffffff'};">${block.content.replace(/\n/g, '<br>')}</div>`
        case 'image':
          if (!block.imageSettings?.url) return ''
          const imageStyles = {
            banner: 'width: 100%; height: 400px; object-fit: cover;',
            center: 'display: block; margin: 0 auto; max-width: 100%; height: 300px; object-fit: cover;',
            left: 'float: left; margin-right: 20px; width: 200px; height: 200px; object-fit: cover;',
            right: 'float: right; margin-left: 20px; width: 200px; height: 200px; object-fit: cover;'
          }
          return `<img src="${block.imageSettings.url}" alt="${block.imageSettings.alt}" style="${imageStyles[block.imageSettings.position]}">`
        default:
          return ''
      }
    }).join('\n')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create submit data with HTML content
    const submitData = {
      ...formData,
      contenido: generateHTMLContent()
    }
    
    // Submit as any to bypass type checking for the submit function
    onSubmit(submitData as any)
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-[#1A1A1A] border border-white/10">
            <TabsTrigger value="edit" className="data-[state=active]:bg-[#D604E0] data-[state=active]:text-white">
              <Edit3 className="w-4 h-4 mr-2" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-[#D604E0] data-[state=active]:text-white">
              <Eye className="w-4 h-4 mr-2" />
              Previsualización
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-[#D604E0] hover:bg-[#D604E0]/80 text-white"
            >
              {isLoading ? 'Guardando...' : noticia ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>

        <TabsContent value="edit" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card className="bg-[#1A1A1A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Información Básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Título</Label>
                    <ControlledInput
                      value={formData.titulo}
                      onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Título de la noticia..."
                      className="bg-[#0A0A0A] border-white/10"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Resumen</Label>
                    <ControlledTextarea
                      value={formData.resumen}
                      onChange={(e) => setFormData(prev => ({ ...prev, resumen: e.target.value }))}
                      placeholder="Breve resumen de la noticia..."
                      rows={3}
                      className="bg-[#0A0A0A] border-white/10"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Imagen Principal</Label>
                    <ControlledInput
                      value={formData.imagen}
                      onChange={(e) => setFormData(prev => ({ ...prev, imagen: e.target.value }))}
                      placeholder="URL de la imagen principal..."
                      className="bg-[#0A0A0A] border-white/10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Content Blocks */}
              <Card className="bg-[#1A1A1A] border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Contenido</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addContentBlock('subtitle')}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Type className="w-4 h-4 mr-1" />
                        Subtítulo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addContentBlock('text')}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Párrafo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addContentBlock('image')}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <ImageIcon className="w-4 h-4 mr-1" />
                        Imagen
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnimatePresence>
                    {formData.contenido.map((block, index) => (
                      <ContentBlockEditor
                        key={block.id}
                        block={block}
                        onUpdate={(updatedBlock) => updateContentBlock(index, updatedBlock)}
                        onDelete={() => deleteContentBlock(index)}
                      />
                    ))}
                  </AnimatePresence>

                  {formData.contenido.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        No hay bloques de contenido. Agrega subtítulos, párrafos o imágenes.
                      </p>
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addContentBlock('subtitle')}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Subtítulo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addContentBlock('text')}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Párrafo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addContentBlock('image')}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Imagen
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-6">
              <Card className="bg-[#1A1A1A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Configuración</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Es Promoción</Label>
                    <CustomSwitch
                      checked={formData.esPromocion}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, esPromocion: checked }))}
                    />
                  </div>

                  {formData.esPromocion && (
                    <div className="space-y-4 border-t border-white/10 pt-4">
                      <div>
                        <Label className="text-white">Fecha de Inicio</Label>
                        <ControlledInput
                          type="date"
                          value={formData.fechaInicio}
                          onChange={(e) => setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                          className="bg-[#0A0A0A] border-white/10"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Fecha de Fin</Label>
                        <ControlledInput
                          type="date"
                          value={formData.fechaFin}
                          onChange={(e) => setFormData(prev => ({ ...prev, fechaFin: e.target.value }))}
                          className="bg-[#0A0A0A] border-white/10"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-white">Sede</Label>
                    <Select value={formData.sedeId} onValueChange={(value) => setFormData(prev => ({ ...prev, sedeId: value }))}>
                      <SelectTrigger className="bg-[#0A0A0A] border-white/10">
                        <SelectValue placeholder="Seleccionar sede" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0A0A] border-white/10">
                        <SelectItem value="">Todas las sedes</SelectItem>
                        {sedes.map((sede) => (
                          <SelectItem key={sede.id} value={sede.id}>
                            {sede.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <NoticiaPreview
            titulo={formData.titulo}
            resumen={formData.resumen}
            imagen={formData.imagen}
            contenido={formData.contenido}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
