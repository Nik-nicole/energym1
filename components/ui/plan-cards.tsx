"use client";

import { motion } from "framer-motion";
import { PlanCard } from "@/components/ui/plan-card";

interface Plan {
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
    id: string;
    sede: {
      id: string;
      nombre: string;
    };
  }>;
}

interface PlanCardsProps {
  planes: Plan[];
  hasActivePlan?: boolean;
  activePlan?: {
    id: string;
    nombre: string;
    esVip: boolean;
  } | null;
}

export function PlanCards({ planes, hasActivePlan, activePlan }: PlanCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-stretch">
      {(planes ?? []).map((plan, index) => (
        <PlanCard 
          key={plan?.id ?? index} 
          plan={plan} 
          index={index} 
          hasActivePlan={hasActivePlan}
          activePlan={activePlan}
        />
      ))}
    </div>
  );
}
