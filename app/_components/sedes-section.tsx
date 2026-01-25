"use client";

import { motion } from "framer-motion";
import { SedeCard } from "@/components/ui/sede-card";
import { MapPin } from "lucide-react";

interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  horario: string;
  imagen: string | null;
}

export function SedesSection({ sedes }: { sedes: Sede[] }) {
  return (
    <section id="sedes" className="py-20 bg-[#0A0A0A]">
      <div className="max-w-[1200px] mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#D604E0]/10 rounded-full text-[#D604E0] text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Ubicaciones
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nuestras <span className="gradient-text">Sedes</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            3 ubicaciones estratégicas en Bogotá para que siempre tengas un
            FitZone cerca. Cada sede con carácter único pero la misma calidad
            premium.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(sedes ?? []).map((sede, index) => (
            <SedeCard key={sede?.id ?? index} sede={sede} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
