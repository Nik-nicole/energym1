"use client";

import { motion } from "framer-motion";
import { Newspaper, Heart, MessageCircle, Share2, ImageIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Noticia {
  id: string;
  titulo: string;
  resumen: string | null;
  imagen: string | null;
  esPromocion: boolean;
  fechaPublicacion: Date;
  sede?: { nombre: string } | null;
}

interface NoticiasSectionProps {
  noticias: Noticia[];
  showViewAll?: boolean;
  customTitle?: React.ReactNode;
  customSubtitle?: string;
}

export function NoticiasSection({ noticias, showViewAll = true, customTitle, customSubtitle }: NoticiasSectionProps) {
  if (!noticias || noticias.length === 0) return null;

  return (
    <section id="noticias" className="py-24 bg-[#0A0A0A] relative overflow-hidden">
      {/* Fondo decorativo sutil */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-64 w-96 h-96 bg-[#040AE0]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-[#D604E0]/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#D604E0]/10 rounded-full text-[#D604E0] text-sm font-medium mb-4">
            <Newspaper className="w-4 h-4" />
            Actualidad
          </span>
          {customTitle || <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Noticias y <span className="gradient-text">Promociones</span>
          </h2>}
          <p className="text-gray-400 max-w-2xl mx-auto">
            {customSubtitle || "Manténte informado sobre las últimas novedades, eventos y ofertas especiales de FitZone."}
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 max-w-6xl mx-auto">
          {noticias.map((noticia, index) => (
            <motion.div
              key={noticia.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative flex flex-col sm:flex-row bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-xl border border-white/5 hover:border-[#D604E0]/30 transition-all duration-300 group h-full sm:h-72"
            >
              {/* Imagen Izquierda (40%) */}
              <div className="w-full sm:w-2/5 relative p-4 flex-shrink-0">
                <Link href={`/noticias/${noticia.id}`} className="block h-48 sm:h-full w-full rounded-xl overflow-hidden relative bg-[#0A0A0A] shadow-inner cursor-pointer">
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
              </div>

              {/* Contenido Derecha */}
              <div className="w-full sm:w-3/5 p-6 flex flex-col relative">
                {/* Etiqueta Superior Derecha */}
                <div className="flex justify-end mb-3">
                  <span className="text-xs font-semibold tracking-wider text-[#D604E0] bg-[#D604E0]/10 px-3 py-1 rounded-full border border-[#D604E0]/20 uppercase">
                    {noticia.sede?.nombre || "General"}
                  </span>
                </div>

                {/* Título */}
                <Link href={`/noticias/${noticia.id}`}>
                  <h3 className="text-2xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-[#D604E0] transition-colors cursor-pointer">
                    {noticia.titulo}
                  </h3>
                </Link>

                {/* Descripción */}
                <p className="text-sm text-gray-400 line-clamp-3 mb-6 flex-grow leading-relaxed">
                  {noticia.resumen || noticia.titulo}
                </p>

                {/* Iconos de Acción (Decorativos/Funcionales) */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div className="flex gap-5 text-gray-500">
                    <button className="group/icon flex items-center gap-1 hover:text-red-400 transition-colors">
                      <Heart className="w-5 h-5 group-hover/icon:fill-current transition-all" />
                    </button>
                    <button className="group/icon flex items-center gap-1 hover:text-[#040AE0] transition-colors">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <button className="group/icon flex items-center gap-1 hover:text-white transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <span className="text-xs text-gray-600 font-medium">
                    {new Date(noticia.fechaPublicacion).toLocaleDateString('es-CO', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {showViewAll && (
          <div className="mt-12 text-center">
            <Link href="/noticias">
              <Button variant="outline" className="border-[#D604E0] text-[#D604E0] hover:bg-[#D604E0] hover:text-white transition-all px-8 py-6 text-lg rounded-full">
                Ver todas las noticias
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
