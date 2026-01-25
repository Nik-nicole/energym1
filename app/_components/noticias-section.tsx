"use client";

import { motion } from "framer-motion";
import { NoticiaCard } from "@/components/ui/noticia-card";
import { Newspaper } from "lucide-react";

interface Noticia {
  id: string;
  titulo: string;
  resumen: string | null;
  imagen: string | null;
  esPromocion: boolean;
  fechaPublicacion: Date;
  sede?: { nombre: string } | null;
}

export function NoticiasSection({ noticias }: { noticias: Noticia[] }) {
  if (!noticias || noticias.length === 0) return null;

  return (
    <section id="noticias" className="py-20 bg-[#0A0A0A]">
      <div className="max-w-[1200px] mx-auto px-4">
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Noticias y <span className="gradient-text">Promociones</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Manténte informado sobre las últimas novedades, eventos y ofertas
            especiales de FitZone.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(noticias ?? []).map((noticia, index) => (
            <NoticiaCard key={noticia?.id ?? index} noticia={noticia} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
