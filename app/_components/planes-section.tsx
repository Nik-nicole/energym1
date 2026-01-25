"use client";

import { motion } from "framer-motion";
import { PlanCard } from "@/components/ui/plan-card";
import { CreditCard } from "lucide-react";

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  beneficios: string[];
  duracion: string;
  esVip: boolean;
  destacado: boolean;
}

export function PlanesSection({ planes }: { planes: Plan[] }) {
  return (
    <section id="planes" className="py-20 bg-[#050505]">
      <div className="max-w-[1200px] mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#040AE0]/10 rounded-full text-[#040AE0] text-sm font-medium mb-4">
            <CreditCard className="w-4 h-4" />
            Membresías
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Elige tu <span className="gradient-text">Plan</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Planes diseñados para cada objetivo. Desde básico hasta VIP con
            acceso a todas las sedes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(planes ?? []).map((plan, index) => (
            <PlanCard key={plan?.id ?? index} plan={plan} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
