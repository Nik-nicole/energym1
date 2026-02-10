"use client"

import { motion } from "framer-motion"
import { Newspaper, Heart, MessageCircle, Share2, ImageIcon, MapPin } from "lucide-react"
import Link from "next/link"
import { NoticiaWithSede } from "@/lib/types"

interface NoticiasGridProps {
  noticias: NoticiaWithSede[]
}

export function NoticiasGrid({ noticias }: NoticiasGridProps) {
  if (!noticias || noticias.length === 0) {
    return (
      <div className="text-center py-12">
        <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No hay noticias disponibles</p>
      </div>
    )
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {noticias.map((noticia, index) => (
        <motion.article
          key={noticia.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="group bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-xl border border-white/5 hover:border-[#D604E0]/30 transition-all duration-300"
        >
          {/* Imagen */}
          <div className="relative h-48 overflow-hidden">
            <Link href={`/noticias/${noticia.id}`} className="block w-full h-full">
              {noticia.imagen ? (
                <img
                  src={noticia.imagen}
                  alt={noticia.titulo}
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1E1E1E] to-[#0A0A0A]">
                  <ImageIcon className="w-12 h-12 text-[#333]" />
                </div>
              )}
            </Link>
            
            {/* Etiqueta de promoción */}
            {noticia.esPromocion && (
              <div className="absolute top-4 left-4">
                <span className="bg-[#D604E0] text-white text-xs font-bold px-3 py-1 rounded-full">
                  PROMOCIÓN
                </span>
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="p-6">
            {/* Sede */}
            {noticia.sede && (
              <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                <MapPin className="w-4 h-4" />
                <span>{noticia.sede.nombre}</span>
              </div>
            )}

            {/* Título */}
            <Link href={`/noticias/${noticia.id}`}>
              <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-[#D604E0] transition-colors">
                {noticia.titulo}
              </h3>
            </Link>

            {/* Resumen */}
            <p className="text-sm text-gray-400 line-clamp-3 mb-6 leading-relaxed">
              {noticia.resumen || noticia.titulo}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex gap-4 text-gray-500">
                <button className="group/icon flex items-center gap-1 hover:text-red-400 transition-colors">
                  <Heart className="w-4 h-4 group-hover/icon:fill-current transition-all" />
                </button>
                <button className="group/icon flex items-center gap-1 hover:text-[#040AE0] transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button className="group/icon flex items-center gap-1 hover:text-white transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
              
              <span className="text-xs text-gray-600 font-medium">
                {new Date(noticia.fechaPublicacion).toLocaleDateString('es-CO', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  )
}
