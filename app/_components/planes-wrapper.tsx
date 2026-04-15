"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { PlanesSection } from "./planes-section";

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
}

interface PlanesWrapperProps {
  planes: Plan[];
}

export function PlanesWrapper({ planes }: PlanesWrapperProps) {
  const { data: session } = useSession();
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [hasFrozenPlan, setHasFrozenPlan] = useState(false);
  const [activePlan, setActivePlan] = useState<{
    id: string;
    nombre: string;
    esVip: boolean;
    status?: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const data = await response.json();
            const user = data.user;
            
            // Verificar si el usuario tiene un plan activo o congelado
            const activeUserPlan = user?.userPlans?.find((userPlan: any) =>
              (userPlan.status === 'ACTIVE' || userPlan.status === 'FROZEN') &&
              (!userPlan.endDate || new Date(userPlan.endDate) > new Date())
            );
            
            if (activeUserPlan && activeUserPlan.plan) {
              const isFrozen = activeUserPlan.status === 'FROZEN';
              setHasActivePlan(!isFrozen);
              setHasFrozenPlan(isFrozen);
              setActivePlan({
                id: activeUserPlan.plan.id,
                nombre: activeUserPlan.plan.nombre,
                esVip: activeUserPlan.plan.tipo === "VIP" || activeUserPlan.plan.esVip,
                status: activeUserPlan.status
              });
            } else {
              setHasActivePlan(false);
              setHasFrozenPlan(false);
              setActivePlan(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user plan:", error);
        }
      }
    };

    fetchUserPlan();
  }, [session]);

  return (
    <PlanesSection 
      planes={planes} 
      hasActivePlan={hasActivePlan}
      hasFrozenPlan={hasFrozenPlan}
      activePlan={activePlan}
    />
  );
}
