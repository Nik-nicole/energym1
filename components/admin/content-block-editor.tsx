"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ControlledInput } from "@/components/ui/controlled-input"
import { ControlledTextarea } from "@/components/ui/controlled-textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Palette,
  Plus,
  Trash2,
  Image as ImageIcon,
  Type
} from "lucide-react"
import { ContentBlock } from "@/types/noticia-editor"
import { motion } from "framer-motion"

interface ContentBlockEditorProps {
  block: ContentBlock
  onUpdate: (block: ContentBlock) => void
  onDelete: () => void
}

export function ContentBlockEditor({ block, onUpdate, onDelete }: ContentBlockEditorProps) {
  const [isEditing, setIsEditing] = useState(true)

  const updateBlock = (updates: Partial<ContentBlock>) => {
    onUpdate({ ...block, ...updates })
  }

  const renderEditor = () => {
    switch (block.type) {
      case 'subtitle':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              <span className="text-sm font-medium">Subtítulo</span>
            </div>
            
            <ControlledInput
              value={block.content}
              onChange={(e) => updateBlock({ content: e.target.value })}
              placeholder="Escribe el subtítulo..."
              className="font-semibold"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Alineación</Label>
                <Select value={block.alignment} onValueChange={(value: any) => updateBlock({ alignment: value })}>
                  <SelectTrigger className="bg-[#1A1A1A] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/10">
                    <SelectItem value="left">Izquierda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Derecha</SelectItem>
                    <SelectItem value="justify">Justificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Tamaño</Label>
                <Select value={block.fontSize} onValueChange={(value: any) => updateBlock({ fontSize: value })}>
                  <SelectTrigger className="bg-[#1A1A1A] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/10">
                    <SelectItem value="small">Pequeño</SelectItem>
                    <SelectItem value="medium">Mediano</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-500">Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={block.color || '#ffffff'}
                  onChange={(e) => updateBlock({ color: e.target.value })}
                  className="w-12 h-8 rounded border border-white/10 bg-[#1A1A1A]"
                />
                <ControlledInput
                  value={block.color || '#ffffff'}
                  onChange={(e) => updateBlock({ color: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              <span className="text-sm font-medium">Párrafo</span>
            </div>
            
            <ControlledTextarea
              value={block.content}
              onChange={(e) => updateBlock({ content: e.target.value })}
              placeholder="Escribe el contenido del párrafo..."
              rows={4}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Alineación</Label>
                <Select value={block.alignment} onValueChange={(value: any) => updateBlock({ alignment: value })}>
                  <SelectTrigger className="bg-[#1A1A1A] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/10">
                    <SelectItem value="left">Izquierda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Derecha</SelectItem>
                    <SelectItem value="justify">Justificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={block.color || '#ffffff'}
                    onChange={(e) => updateBlock({ color: e.target.value })}
                    className="w-12 h-8 rounded border border-white/10 bg-[#1A1A1A]"
                  />
                  <ControlledInput
                    value={block.color || '#ffffff'}
                    onChange={(e) => updateBlock({ color: e.target.value })}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Imagen</span>
            </div>
            
            <ControlledInput
              value={block.imageSettings?.url || ''}
              onChange={(e) => updateBlock({ 
                imageSettings: { 
                  position: block.imageSettings?.position || 'center',
                  url: e.target.value,
                  alt: block.imageSettings?.alt || ''
                }
              })}
              placeholder="URL de la imagen..."
            />

            <ControlledInput
              value={block.imageSettings?.alt || ''}
              onChange={(e) => updateBlock({ 
                imageSettings: { 
                  position: block.imageSettings?.position || 'center',
                  url: block.imageSettings?.url || '',
                  alt: e.target.value
                }
              })}
              placeholder="Texto alternativo..."
            />

            <div>
              <Label className="text-xs text-gray-500">Posición</Label>
              <Select value={block.imageSettings?.position} onValueChange={(value: any) => updateBlock({ 
                imageSettings: { 
                  position: value,
                  url: block.imageSettings?.url || '',
                  alt: block.imageSettings?.alt || ''
                }
              })}>
                <SelectTrigger className="bg-[#1A1A1A] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10">
                  <SelectItem value="banner">Banner (ancho completo)</SelectItem>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-[#1A1A1A] rounded-lg p-4 border border-white/5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {block.type === 'subtitle' && <Type className="w-4 h-4 text-[#D604E0]" />}
          {block.type === 'text' && <Type className="w-4 h-4 text-[#040AE0]" />}
          {block.type === 'image' && <ImageIcon className="w-4 h-4 text-[#D604E0]" />}
          <span className="text-sm font-medium capitalize">
            {block.type === 'subtitle' ? 'Subtítulo' : block.type === 'text' ? 'Párrafo' : 'Imagen'}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {renderEditor()}
    </motion.div>
  )
}
