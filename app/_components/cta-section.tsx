"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 bg-[#050505]">
      <div className="max-w-[1200px] mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D604E0]/20 via-[#0A0A0A] to-[#040AE0]/20 border border-white/10 p-8 md:p-16 text-center"
        >
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#D604E0]/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#040AE0]/20 rounded-full blur-[100px]" />

          <div className="relative z-10">
            <Zap className="w-12 h-12 text-[#D604E0] mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para <span className="gradient-text">transformarte</span>?
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto mb-8">
              Únete a más de 10,000 miembros que ya están alcanzando sus metas
              con Energym. Tu primera sesión de prueba es gratis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/registro"
                className="px-8 py-4 gradient-bg rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Registrarme Ahora
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/#sedes"
                className="px-8 py-4 bg-white/10 border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/20 transition-colors"
              >
                Ver Sedes
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
