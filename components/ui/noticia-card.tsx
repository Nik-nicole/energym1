"use client";

import Image from "next/image";
import { Calendar, Tag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface NoticiaCardProps {
  noticia: {
    id: string;
    titulo: string;
    resumen: string | null;
    imagen: string | null;
    esPromocion: boolean;
    fechaPublicacion: Date | string;
    sede?: { nombre: string } | null;
  };
  index: number;
}

export function NoticiaCard({ noticia, index }: NoticiaCardProps) {
  const fecha = noticia?.fechaPublicacion
    ? new Date(noticia.fechaPublicacion).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group rounded-2xl overflow-hidden bg-[#141414] border border-white/10 hover:border-[#040AE0]/50 transition-all duration-300 card-glow-hover"
    >
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={noticia?.imagen ?? "https://cdn.abacus.ai/images/d9570e29-20cc-4090-b76d-62f460a6b818.png"}
          alt={noticia?.titulo ?? "Noticia"}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {noticia?.esPromocion && (
          <div className="absolute top-3 left-3 px-3 py-1 gradient-bg rounded-full text-xs font-medium flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Promoción
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 text-gray-400 text-xs mb-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {fecha}
          </span>
          {noticia?.sede?.nombre && (
            <span className="px-2 py-0.5 bg-white/10 rounded text-[#D604E0]">
              {noticia.sede.nombre}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-[#D604E0] transition-colors">
          {noticia?.titulo ?? ""}
        </h3>
        <p className="text-gray-400 text-sm line-clamp-2 mb-3">
          {noticia?.resumen ?? ""}
        </p>
        <span className="flex items-center gap-1 text-[#040AE0] text-sm font-medium">
          Leer más
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </motion.div>
  );
}
