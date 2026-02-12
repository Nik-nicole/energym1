"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Dumbbell, Users, Award } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://cdn.abacus.ai/images/d9570e29-20cc-4090-b76d-62f460a6b818.png"
          alt="Energym Gym"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 hero-gradient" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 pt-60 pb-24 justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          
          <div className="flex flex-col items-center justify-center mb-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-center">
              Transforma tu vida con
            </h1>
            <img
              src="/logo.png"
              alt="Energym Logo"
              className="w-64 h-32 object-contain mt-4"
            />
          </div>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            En ENERGYM Club creemos en el poder de romper límites.
            En el fuego interno que te impulsa, incluso cuando nadie está mirando.
            No somos un gimnasio. Somos un manifiesto de alto rendimiento, una comunidad que vive la disciplina como estilo de vida y el bienestar como lujo esencial.
            Aquí cada detalle está diseñado para inspirarte, desafiarte y elevar tu nivel.
            Este es el club donde la energía se vuelve identidad…
            Y donde tu transformación se vuelve inevitable.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/registro"
              className="px-8 py-4 gradient-bg rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Empieza Hoy
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/#planes"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Ver Planes
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-3 gap-4 max-w-xl mx-auto"
        >
          
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}
