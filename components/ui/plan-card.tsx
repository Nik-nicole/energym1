"use client";

import { useState } from "react";

import { Check, Crown, Zap, Star, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface PlanCardProps {
  plan: {
    id: string;
    nombre: string;
    precio: number;
    descripcion: string;
    beneficios: string[];
    duracion: string;
    esVip: boolean;
    destacado: boolean;
  };
  index: number;
}

export function PlanCard({ plan, index }: PlanCardProps) {
  const { data: session } = useSession();
  const isVip = plan?.esVip ?? false;
  const isDestacado = plan?.destacado ?? false;

  const [showBenefits, setShowBenefits] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price ?? 0);
  };

  const handleSelectPlan = () => {
    if (!session) {
      // Si no está logueado, redirigir a login
      window.location.href = `/login?redirect=/planes&id=${plan.id}`;
      return;
    }

    // Si está logueado, redirigir a pago con PSG
    window.location.href = `/pago/${plan.id}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col h-full ${
        isVip
          ? "bg-gradient-to-br from-[#D604E0]/20 to-[#040AE0]/20 border-2 border-[#D604E0]/50 card-glow"
          : "bg-[#141414] border border-white/10 hover:border-white/20"
      } card-glow-hover`}
    >
      {isVip && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gradient-bg rounded-full text-sm font-medium flex items-center gap-1">
          <Crown className="w-4 h-4" />
          VIP
        </div>
      )}
      {isDestacado && !isVip && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#040AE0] rounded-full text-sm font-medium flex items-center gap-1">
          <Star className="w-4 h-4" />
          Popular
        </div>
      )}

      <div className="text-center mb-6 pt-2 flex-grow">
          <h3 className={`text-xl font-bold mb-2 ${isVip ? "gradient-text" : "text-white"}`}>
            {plan?.nombre ?? "Plan"}
          </h3>
          <p className="text-gray-400 text-sm mb-4">{plan?.descripcion ?? ""}</p>
          <div className="flex flex-col items-center justify-center gap-2">
            <span className={`text-4xl font-bold text-white`}>
              {formatPrice(plan?.precio ?? 0)}
            </span>
            <span className={`text-lg font-bold ${isVip ? "text-[#D604E0]" : "text-[#040AE0]"}`}>
              {plan?.duracion ?? "mes"}
            </span>
          </div>
        </div>
        <button
            onClick={handleSelectPlan}
            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isVip
                ? "gradient-bg hover:opacity-90"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            {session ? "Seleccionar Plan" : "Empezar Ahora"}
          </button>

        <div className="flex flex-col gap-3 mt-auto">
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowBenefits(!showBenefits)}
              className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-white/5"
            >
              <span className="text-base">
                {showBenefits ? "Ocultar beneficios" : "Ver beneficios"}
              </span>
              <motion.div
                animate={{ rotate: showBenefits ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            {showBenefits && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-700 bg-gray-800/50"
              >
                <ul className="space-y-3 p-4">
                  {(plan?.beneficios ?? [])
                    .filter(beneficio => 
                      beneficio && 
                      !beneficio.includes("documento con foto") && 
                      !beneficio.includes("quien te refiera")
                    )
                    .map((beneficio, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                        <Check className={`w-5 h-5 flex-shrink-0 ${isVip ? "text-[#D604E0]" : "text-[#040AE0]"}`} />
                        <span>{beneficio ?? ""}</span>
                      </li>
                    ))}
                </ul>
              </motion.div>
            )}
          </div>

          
        </div>
    </motion.div>
  );
}
