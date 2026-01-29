"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Heart, MessageCircle, Share2, MapPin, Calendar, Tag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { NoticiaWithSede } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface NoticiaDetailProps {
  noticia: NoticiaWithSede
}

export function NoticiaDetail({ noticia }: NoticiaDetailProps) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleShare = async () => {
    const url = shareUrl
    const title = noticia.titulo
    const text = noticia.resumen || noticia.titulo

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        })
      } catch (error) {
        // Si el usuario cancela, no hacemos nada
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copiar al portapapeles y mostrar opciones
      try {
        await navigator.clipboard.writeText(url)
        
        // Opcional: mostrar mensaje de éxito
        alert('¡Enlace copiado al portapapeles!')
        
        // También abrir redes sociales en nueva ventana
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        
        // Preguntar qué red social usar
        const socialChoice = confirm('¿Deseas compartir en WhatsApp? (Cancel para otras opciones)')
        if (socialChoice) {
          window.open(whatsappUrl, '_blank', 'width=600,height=400')
        } else {
          const twitterChoice = confirm('¿Deseas compartir en Twitter/X?')
          if (twitterChoice) {
            window.open(twitterUrl, '_blank', 'width=600,height=400')
          } else {
            window.open(facebookUrl, '_blank', 'width=600,height=400')
          }
        }
      } catch (error) {
        console.error('Error sharing:', error)
        alert('No se pudo compartir. Por favor, copia el enlace manualmente.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header con navegación */}
      <div className="container mx-auto px-4 py-8">
        <Link href="/noticias">
          <Button variant="ghost" className="text-gray-400 hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a noticias
          </Button>
        </Link>
      </div>

      <article className="container mx-auto px-4 pb-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          {/* Categoría y meta información */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
            {noticia.esPromocion && (
              <span className="bg-[#D604E0] text-white font-bold px-4 py-2 rounded-full">
                PROMOCIÓN
              </span>
            )}
            
            {noticia.sede && (
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{noticia.sede.nombre}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(noticia.fechaPublicacion).toLocaleDateString('es-CO', { 
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
            {noticia.titulo}
          </h1>

          {/* Acciones sociales */}
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span>Compartir</span>
            </button>
          </div>
        </motion.div>

        {/* Imagen banner */}
        {noticia.imagen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="relative w-full h-[300px] md:h-[350px] rounded-2xl overflow-hidden">
              <Image
                src={noticia.imagen}
                alt={noticia.titulo}
                fill
                className="object-cover"
                priority
              />
              {/* Overlay para mejor legibilidad */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>
          </motion.div>
        )}

        {/* Contenido */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          {/* Resumen */}
          {noticia.resumen && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Resumen</h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                {noticia.resumen}
              </p>
            </div>
          )}

          {/* Contenido completo */}
          <div className="prose prose-invert prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-white mb-6">Artículo completo</h2>
            <div 
              className="text-gray-300 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: noticia.contenido }}
            />
          </div>

          {/* Fechas de promoción */}
          {noticia.esPromocion && (noticia.fechaInicio || noticia.fechaFin) && (
            <div className="mt-12 p-6 bg-[#1A1A1A] rounded-2xl border border-[#D604E0]/30">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#D604E0]" />
                Vigencia de la promoción
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                {noticia.fechaInicio && (
                  <div>
                    <span className="text-sm text-gray-500">Fecha de inicio:</span>
                    <p className="font-medium">
                      {new Date(noticia.fechaInicio).toLocaleDateString('es-CO', { 
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {noticia.fechaFin && (
                  <div>
                    <span className="text-sm text-gray-500">Fecha de fin:</span>
                    <p className="font-medium">
                      {new Date(noticia.fechaFin).toLocaleDateString('es-CO', { 
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navegación */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Link href="/noticias">
                <Button variant="outline" className="border-[#D604E0] text-[#D604E0] hover:bg-[#D604E0] hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Ver más noticias
                </Button>
              </Link>
              
              <div className="flex gap-4">
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] rounded-lg border border-white/10 hover:border-[#D604E0]/30 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </article>
    </div>
  )
}
