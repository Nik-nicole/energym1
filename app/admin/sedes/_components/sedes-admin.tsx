"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Phone, Mail, ExternalLink } from "lucide-react";

interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string | null;
  descripcion: string;
  imagen: string | null;
  latitud: number | null;
  longitud: number | null;
  horario: string;
  activo: boolean;
}

export function SedesAdmin({ initialSedes }: { initialSedes: Sede[] }) {
  const [sedes] = useState<Sede[]>(initialSedes ?? []);

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-[1200px] mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Volver al panel
          </Link>
          <h1 className="text-3xl font-bold">Información de Sedes</h1>
          <p className="text-gray-400 mt-2">
            Consulta la información de las sedes. Para modificar datos de sedes contacta al equipo técnico.
          </p>
        </motion.div>

        <div className="grid gap-6">
          {(sedes ?? []).map((sede, index) => (
            <motion.div
              key={sede?.id ?? index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#141414] rounded-xl border border-white/10 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="relative aspect-video md:aspect-auto">
                  <Image
                    src={sede?.imagen ?? "https://cdn.abacus.ai/images/d9570e29-20cc-4090-b76d-62f460a6b818.png"}
                    alt={sede?.nombre ?? "Sede"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="md:col-span-2 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">{sede?.nombre ?? ""}</h2>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      sede?.activo ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {sede?.activo ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{sede?.descripcion ?? ""}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-300 text-sm">
                      <MapPin className="w-4 h-4 text-[#D604E0]" />
                      {sede?.direccion ?? ""}, {sede?.ciudad ?? ""}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 text-sm">
                      <Phone className="w-4 h-4 text-[#040AE0]" />
                      {sede?.telefono ?? ""}
                    </div>
                    {sede?.email && (
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Mail className="w-4 h-4 text-[#D604E0]" />
                        {sede.email}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/sedes/${sede?.id ?? ""}`}
                      target="_blank"
                      className="px-4 py-2 bg-white/10 rounded-lg text-sm flex items-center gap-2 hover:bg-white/20"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver página pública
                    </Link>
                    <a
                      href={`https://www.google.com/maps?q=${sede?.latitud ?? 0},${sede?.longitud ?? 0}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#040AE0]/20 text-[#040AE0] rounded-lg text-sm flex items-center gap-2 hover:bg-[#040AE0]/30"
                    >
                      <MapPin className="w-4 h-4" />
                      Ver en mapa
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
