"use client";

import { useState } from "react";

import { Check, Crown, Zap, Star, ChevronDown, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PlanCardProps {
  plan: {
    id: string;
    nombre: string;
    precio: number;
    descripcion: string;
    beneficios: string[];
    duracion: string;
    tipo: string;
    esVip: boolean;
    destacado: boolean;
    activo: boolean;
    sedes?: Array<{
      sede: {
        id: string;
        nombre: string;
      };
    }>;
  };
  index: number;
  hasActivePlan?: boolean;
  hasFrozenPlan?: boolean;
  activePlan?: {
    id: string;
    nombre: string;
    esVip: boolean;
    status?: string;
  } | null | undefined;
}

export function PlanCard({ plan, index, hasActivePlan, hasFrozenPlan, activePlan }: PlanCardProps) {
  const { data: session } = useSession();
  const isVip = plan?.esVip ?? false;
  const isDestacado = plan?.destacado ?? false;
  const [showBenefits, setShowBenefits] = useState(false);
  const [showSedeErrorModal, setShowSedeErrorModal] = useState(false);
  const [showActivePlanModal, setShowActivePlanModal] = useState(false);
  const [showFrozenPlanModal, setShowFrozenPlanModal] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price ?? 0);
  };

  // Verificar si el usuario puede comprar este plan
  const canUserPurchasePlan = () => {
    if (!session) return true; // Si no está logueado, puede ver el plan pero se le pedirá login
    
    // Si el usuario no tiene sede asignada, puede comprar cualquier plan
    if (!session.user.sedeId) return true;
    
    // Si el plan no tiene sedes asignadas, no está disponible
    if (!plan.sedes || plan.sedes.length === 0) return false;
    
    // Verificar si el plan está disponible en la sede del usuario
    return plan.sedes.some(sede => sede.sede.id === session.user.sedeId);
  };

  const handleSelectPlan = () => {
    if (!session) {
      // Si no está logueado, redirigir a login
      return; // El Link se encargará de la redirección
    }

    // Si el usuario tiene un plan congelado, mostrar modal específico
    if (hasFrozenPlan && activePlan !== null && activePlan !== undefined) {
      setShowFrozenPlanModal(true);
      return;
    }

    // Si el usuario ya tiene un plan activo, mostrar modal
    if (hasActivePlan && activePlan !== null && activePlan !== undefined) {
      setShowActivePlanModal(true);
      return;
    }

    // Verificar si el usuario puede comprar este plan
    if (!canUserPurchasePlan()) {
      setShowSedeErrorModal(true);
      return;
    }

    // Si está logueado y puede comprar, el Link se encargará de la redirección
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
        {!session ? (
          <Link
            href={`/login?redirect=/planes&id=${plan.id}`}
            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isVip
                ? "gradient-bg hover:opacity-90"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            Empezar Ahora
          </Link>
        ) : hasFrozenPlan && activePlan !== null && activePlan !== undefined ? (
          <button
            onClick={handleSelectPlan}
            className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/50 cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            Plan Congelado
          </button>
        ) : hasActivePlan && activePlan !== null && activePlan !== undefined ? (
          <button
            onClick={handleSelectPlan}
            className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/50 cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            Tienes Plan Activo
          </button>
        ) : !canUserPurchasePlan() ? (
          <button
            onClick={handleSelectPlan}
            className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-red-500/20 text-red-400 border border-red-500/50 cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            No disponible en tu sede
          </button>
        ) : (
          <Link
            href={`/pago/${plan.id}`}
            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isVip
                ? "gradient-bg hover:opacity-90"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            Seleccionar Plan
          </Link>
        )}

          {/* Modal de error de sede */}
          <AnimatePresence>
            {showSedeErrorModal && (
              <Dialog open={showSedeErrorModal} onOpenChange={setShowSedeErrorModal}>
                <DialogContent className="bg-[#1A1A1A] border border-[#2A2A2A] text-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400">Restricción de Sede</span>
                    </DialogTitle>
                  </DialogHeader>
                  <DialogDescription className="text-gray-300">
                    No puedes comprar este plan porque no perteneces a esta sede donde se encuentra el plan. 
                    Solo puedes comprar planes disponibles en tu sede actual.
                  </DialogDescription>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowSedeErrorModal(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Entendido
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </AnimatePresence>

          {/* Modal de plan activo */}
          <AnimatePresence>
            {showActivePlanModal && (
              <Dialog open={showActivePlanModal} onOpenChange={setShowActivePlanModal}>
                <DialogContent className="bg-[#1A1A1A] border border-[#2A2A2A] text-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      <span className="text-orange-400">Ya tienes un plan activo</span>
                    </DialogTitle>
                  </DialogHeader>
                  <DialogDescription className="text-gray-300">
                    Actualmente tienes el plan <span className="font-bold text-orange-400">{activePlan?.nombre}</span> activo.
                    Si deseas realizar cambios o adquirir un nuevo plan, por favor comunícate con el administrador.
                  </DialogDescription>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowActivePlanModal(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Entendido
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </AnimatePresence>

          {/* Modal de plan congelado */}
          <AnimatePresence>
            {showFrozenPlanModal && (
              <Dialog open={showFrozenPlanModal} onOpenChange={setShowFrozenPlanModal}>
                <DialogContent className="bg-[#1A1A1A] border border-[#2A2A2A] text-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400" />
                      <span className="text-blue-400">Plan Congelado</span>
                    </DialogTitle>
                  </DialogHeader>
                  <DialogDescription className="text-gray-300">
                    Actualmente tienes el plan <span className="font-bold text-blue-400">{activePlan?.nombre}</span> congelado.
                    Mientras el plan esté congelado, no puedes comprar nuevos planes.
                    Para reactivar tu plan, por favor comunícate con el administrador.
                  </DialogDescription>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowFrozenPlanModal(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Entendido
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </AnimatePresence>

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
