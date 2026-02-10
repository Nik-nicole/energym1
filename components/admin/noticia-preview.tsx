"use client"

import { ContentBlock } from "@/types/noticia-editor"
import { motion } from "framer-motion"
import Image from "next/image"

interface NoticiaPreviewProps {
  titulo: string
  resumen: string
  imagen: string
  contenido: ContentBlock[]
}

export function NoticiaPreview({ titulo, resumen, imagen, contenido }: NoticiaPreviewProps) {
  const renderContentBlock = (block: ContentBlock, index: number) => {
    const baseStyles = "mb-6"
    
    switch (block.type) {
      case 'subtitle':
        const subtitleSize = block.fontSize === 'large' ? 'text-3xl' : block.fontSize === 'small' ? 'text-xl' : 'text-2xl'
        const subtitleAlign = block.alignment === 'center' ? 'text-center' : block.alignment === 'right' ? 'text-right' : block.alignment === 'justify' ? 'text-justify' : 'text-left'
        
        return (
          <motion.h2
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${baseStyles} ${subtitleSize} ${subtitleAlign} font-bold`}
            style={{ color: block.color || '#ffffff' }}
          >
            {block.content}
          </motion.h2>
        )

      case 'text':
        const textAlign = block.alignment === 'center' ? 'text-center' : block.alignment === 'right' ? 'text-right' : block.alignment === 'justify' ? 'text-justify' : 'text-left'
        
        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${baseStyles} ${textAlign} leading-relaxed`}
            style={{ color: block.color || '#ffffff' }}
          >
            {block.content.split('\n').map((paragraph, pIndex) => (
              <p key={pIndex} className="mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </motion.div>
        )

      case 'image':
        if (!block.imageSettings?.url) return null
        
        const imagePosition = block.imageSettings.position
        
        if (imagePosition === 'banner') {
          return (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`${baseStyles} w-full h-64 md:h-80 relative rounded-xl overflow-hidden`}
            >
              <Image
                src={block.imageSettings.url}
                alt={block.imageSettings.alt || ''}
                fill
                className="object-cover"
              />
            </motion.div>
          )
        }
        
        if (imagePosition === 'center') {
          return (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`${baseStyles} flex justify-center`}
            >
              <div className="relative w-full max-w-2xl h-48 md:h-64 rounded-xl overflow-hidden">
                <Image
                  src={block.imageSettings.url}
                  alt={block.imageSettings.alt || ''}
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          )
        }
        
        // left or right
        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, x: imagePosition === 'left' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${baseStyles} flex gap-6 ${
              imagePosition === 'left' ? 'flex-row' : 'flex-row-reverse'
            }`}
          >
            <div className="relative w-32 h-32 md:w-48 md:h-48 flex-shrink-0 rounded-xl overflow-hidden">
              <Image
                src={block.imageSettings.url}
                alt={block.imageSettings.alt || ''}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 text-gray-300 leading-relaxed">
              {/* Espacio para texto adicional si se necesita */}
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-[#0A0A0A] rounded-xl p-8 border border-white/10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {titulo || 'Título de la noticia'}
          </h1>
          
          {resumen && (
            <p className="text-lg text-gray-300 leading-relaxed">
              {resumen}
            </p>
          )}
        </div>

        {/* Banner Image */}
        {imagen && (
          <div className="w-full h-64 md:h-80 relative rounded-xl overflow-hidden mb-8">
            <Image
              src={imagen}
              alt={titulo || 'Imagen de la noticia'}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content Blocks */}
        <div className="space-y-6">
          {contenido.map((block, index) => renderContentBlock(block, index))}
        </div>

        {/* Empty state */}
        {contenido.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              El contenido aparecerá aquí. Agrega bloques de texto, subtítulos e imágenes para crear tu noticia.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
