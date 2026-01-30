"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, ArrowLeft, Check, Zap } from "lucide-react";
import { NoticiaCard } from "@/components/ui/noticia-card";

interface SedeDetailProps {
  sede: {
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
  };
  planes: {
    id: string;
    nombre: string;
    precio: number;
    descripcion: string;
    beneficios: string[];
    duracion: string;
    esVip: boolean;
    destacado: boolean;
  }[];
  noticias: {
    id: string;
    titulo: string;
    resumen: string | null;
    imagen: string | null;
    esPromocion: boolean;
    fechaPublicacion: Date;
    sede?: { nombre: string } | null;
  }[];
}

export function SedeDetailClient({ sede, planes, noticias }: SedeDetailProps) {
  const mapUrl = `https://i.ytimg.com/vi/5dRG80KTIzI/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBLAvkok-0p_jRIxeJhhmFQ1WRqVw ?? -74.0628}!3d${sede?.latitud ?? 4.6486}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${sede?.latitud ?? 0}°${Math.abs((sede?.latitud ?? 0) % 1 * 60).toFixed(0)}'N%20${Math.abs(sede?.longitud ?? 0)}°${Math.abs((sede?.longitud ?? 0) % 1 * 60).toFixed(0)}'W!5e0!3m2!1ses!2sco!4v1&markers=color:red%7C${sede?.latitud ?? 0},${sede?.longitud ?? 0}`;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price ?? 0);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px]">
        <Image
          src={sede?.imagen ?? "https://cdn.abacus.ai/images/d9570e29-20cc-4090-b76d-62f460a6b818.png"}
          alt={sede?.nombre ?? "Sede"}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-[1200px] mx-auto px-4 pb-12 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href="/#sedes"
                className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a sedes
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {sede?.nombre ?? ""}
              </h1>
              <p className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-5 h-5 text-[#D604E0]" />
                {sede?.direccion ?? ""}, {sede?.ciudad ?? ""}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Info y Mapa */}
      <section className="py-16 bg-[#0A0A0A]">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold mb-4">Sobre esta sede</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {sede?.descripcion ?? ""}
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-10 h-10 rounded-lg bg-[#D604E0]/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#D604E0]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p>{sede?.telefono ?? ""}</p>
                  </div>
                </div>

                {sede?.email && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-10 h-10 rounded-lg bg-[#040AE0]/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-[#040AE0]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p>{sede.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 text-gray-300">
                  <div className="w-10 h-10 rounded-lg bg-[#D604E0]/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#D604E0]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Horario</p>
                    <div className="space-y-1">
                      {(sede?.horario ?? "").split("|").map((h, i) => (
                        <p key={i}>{h?.trim() ?? ""}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-white/10 h-[400px]"
            >
              <iframe
                src={`https://www.google.com/maps?q=${sede?.latitud ?? 0},${sede?.longitud ?? 0}&z=15&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Mapa de ${sede?.nombre ?? "sede"}`}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Planes disponibles */}
      <section className="py-16 bg-[#050505]">
        <div className="max-w-[1200px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">
              Planes disponibles en <span className="gradient-text">{sede?.nombre ?? ""}</span>
            </h2>
            <p className="text-gray-400">
              Todos nuestros planes incluyen acceso a instalaciones premium
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(planes ?? []).map((plan, index) => (
              <motion.div
                key={plan?.id ?? index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-5 ${
                  plan?.esVip
                    ? "bg-gradient-to-br from-[#D604E0]/20 to-[#040AE0]/20 border-2 border-[#D604E0]/50"
                    : "bg-[#141414] border border-white/10"
                }`}
              >
                <h3 className={`text-lg font-bold mb-2 ${plan?.esVip ? "gradient-text" : ""}`}>
                  {plan?.nombre ?? ""}
                </h3>
                <div className="text-2xl font-bold mb-3">
                  {formatPrice(plan?.precio ?? 0)}
                  <span className="text-sm text-gray-400 font-normal">/{plan?.duracion ?? "mes"}</span>
                </div>
                <ul className="space-y-2 mb-4">
                  {(plan?.beneficios ?? []).slice(0, 4).map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-[#D604E0] flex-shrink-0 mt-0.5" />
                      {b ?? ""}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/registro"
                  className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
                    plan?.esVip ? "gradient-bg" : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Inscribirse
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Noticias de la sede */}
      {noticias && noticias.length > 0 && (
        <section className="py-16 bg-[#0A0A0A]">
          <div className="max-w-[1200px] mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">
                Noticias y <span className="gradient-text">Promociones</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {noticias.map((noticia, index) => (
                <NoticiaCard key={noticia?.id ?? index} noticia={noticia} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
