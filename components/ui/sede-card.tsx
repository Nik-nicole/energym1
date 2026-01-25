"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface SedeCardProps {
  sede: {
    id: string;
    nombre: string;
    direccion: string;
    ciudad: string;
    horario: string;
    imagen: string | null;
  };
  index: number;
}

export function SedeCard({ sede, index }: SedeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      viewport={{ once: true }}
    >
      <Link
        href={`/sedes/${sede?.id ?? ""}`}
        className="block group rounded-2xl overflow-hidden bg-[#141414] border border-white/10 hover:border-[#D604E0]/50 transition-all duration-300 card-glow-hover"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={sede?.imagen ?? "https://cdn.abacus.ai/images/d9570e29-20cc-4090-b76d-62f460a6b818.png"}
            alt={sede?.nombre ?? "Sede"}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white mb-1">{sede?.nombre ?? ""}</h3>
            <p className="text-gray-300 text-sm flex items-center gap-1">
              <MapPin className="w-4 h-4 text-[#D604E0]" />
              {sede?.direccion ?? ""}, {sede?.ciudad ?? ""}
            </p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-gray-400 text-sm flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#040AE0]" />
            <span className="line-clamp-1">{sede?.horario?.split("|")[0] ?? ""}</span>
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[#D604E0] text-sm font-medium">Ver más detalles</span>
            <ArrowRight className="w-5 h-5 text-[#D604E0] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
