"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Heart, MessageCircle, Share2, MapPin, Calendar, Tag, Instagram, Twitter, Facebook } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { NoticiaWithSede } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface NoticiaDetailProps {
  noticia: NoticiaWithSede
}

export function NoticiaDetail({ noticia }: NoticiaDetailProps) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleShare = async (platform?: string) => {
    const url = shareUrl
    const title = noticia.titulo
    const text = noticia.resumen || noticia.titulo

    if (platform === 'instagram') {
      // Instagram no permite compartir enlaces directamente, solo copiamos
      await navigator.clipboard.writeText(url)
      alert('¡Enlace copiado para compartir en Instagram!')
    } else if (platform === 'twitter') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
      window.open(twitterUrl, '_blank', 'width=600,height=400')
    } else if (platform === 'facebook') {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      window.open(facebookUrl, '_blank', 'width=600,height=400')
    } else if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      await navigator.clipboard.writeText(url)
      alert('¡Enlace copiado al portapapeles!')
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Banner Image at the very top */}
      {noticia.imagen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative w-full h-[400px] md:h-[500px]"
        >
          <Image
            src={noticia.imagen}
            alt={noticia.titulo}
            fill
            className="object-cover"
            priority
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Navigation button */}
          <div className="absolute top-8 left-4">
            <Link href="/noticias">
              <Button variant="ghost" className="text-white hover:text-white bg-black/20 backdrop-blur-sm border border-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Noticias
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          {/* Title Section */}
          <div className="text-center mb-12">
            {/* Date and Location */}
            <div className="flex items-center justify-center gap-6 mb-6 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(noticia.fechaPublicacion).toLocaleDateString('es-CO', { 
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              {noticia.sede && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{noticia.sede.nombre}</span>
                </div>
              )}
              {noticia.esPromocion && (
                <span className="bg-[#D604E0] text-white text-xs font-bold px-3 py-1 rounded-full">
                  PROMOCIÓN
                </span>
              )}
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
              {noticia.titulo}
            </h1>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column - Social Share */}
            <div className="lg:col-span-2">
              <div className="sticky top-8 space-y-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Compartir</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleShare('instagram')}
                    className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-white/10 hover:border-[#D604E0]/30 transition-all flex items-center justify-center group"
                  >
                    <Instagram className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-white/10 hover:border-[#040AE0]/30 transition-all flex items-center justify-center group"
                  >
                    <Twitter className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-white/10 hover:border-[#040AE0]/30 transition-all flex items-center justify-center group"
                  >
                    <Facebook className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>
            </div>

            {/* Middle Column - Main Content */}
            <div className="lg:col-span-7">
              <article className="prose prose-invert prose-lg max-w-none">
                {/* Summary */}
                {noticia.resumen && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Resumen</h2>
                    <p className="text-lg text-gray-300 leading-relaxed">
                      {noticia.resumen}
                    </p>
                  </div>
                )}

                {/* Full Content */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Artículo completo</h2>
                  <div 
                    className="text-gray-300 leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{ __html: noticia.contenido }}
                  />
                </div>

                {/* Promotion Dates */}
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
              </article>
            </div>

            {/* Right Column - Details & Author */}
            <div className="lg:col-span-3">
              <div className="sticky top-8 space-y-8">
                {/* Details Box */}
                <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Detalles</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fecha</span>
                      <span className="text-gray-300">
                        {new Date(noticia.fechaPublicacion).toLocaleDateString('es-CO', { 
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Categoría</span>
                      <span className="text-gray-300">
                        {noticia.esPromocion ? 'Promoción' : 'Noticia'}
                      </span>
                    </div>
                    {noticia.sede && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sede</span>
                        <span className="text-gray-300">{noticia.sede.nombre}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tiempo de lectura</span>
                      <span className="text-gray-300">3 min</span>
                    </div>
                  </div>
                </div>

                {/* Author Box */}
                <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Autor</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D604E0] to-[#040AE0] flex items-center justify-center">
                      <span className="text-white font-bold text-lg">FZ</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">FitZone Team</h4>
                      <p className="text-gray-500 text-sm">Equipo FitZone</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Equipo profesional dedicado a brindarte el mejor contenido sobre fitness, bienestar y estilo de vida saludable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
