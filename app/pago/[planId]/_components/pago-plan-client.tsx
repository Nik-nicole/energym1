"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Check, ExternalLink, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  duracion: string;
  esVip: boolean;
}

interface PagoPlanClientProps {
  plan: Plan;
}

export function PagoPlanClient({ plan }: PagoPlanClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFrozenPlan, setHasFrozenPlan] = useState(false);
  const [frozenPlanName, setFrozenPlanName] = useState<string>('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Verificar si el usuario tiene un plan congelado
  useEffect(() => {
    const checkUserPlan = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const data = await response.json();
            const user = data.user;
            
            // Buscar plan congelado
            const frozenPlan = user?.userPlans?.find((userPlan: any) =>
              userPlan.status === 'FROZEN' &&
              (!userPlan.endDate || new Date(userPlan.endDate) > new Date())
            );
            
            if (frozenPlan && frozenPlan.plan) {
              setHasFrozenPlan(true);
              setFrozenPlanName(frozenPlan.plan.nombre);
            } else {
              setHasFrozenPlan(false);
              setFrozenPlanName('');
            }
          }
        } catch (error) {
          console.error("Error checking user plan:", error);
        }
      }
    };

    checkUserPlan();
  }, [session]);

  const handleProceedToPayment = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    // Verificar si el usuario tiene un plan congelado
    if (hasFrozenPlan) {
      alert(`No puedes realizar esta compra porque tienes el plan "${frozenPlanName}" congelado. Por favor contacta al administrador para reactivar tu plan.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Llamar al endpoint de Bold para generar el pago
      const response = await fetch("/api/payments/bold/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Error al preparar el pago");
      }

      const { paymentUrl } = data;

      window.location.href = paymentUrl;
    } catch (error) {
      console.error("[Bold] Error al procesar el pago:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al procesar el pago";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Modal de Carga */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  <p className="text-white font-medium">Conectando con la pasarela de pago...</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-light text-white mb-1">Completar Pago</h1>
              <p className="text-gray-400 text-sm">Finaliza tu suscripción al plan</p>
            </div>
          </div>
        </motion.div>

        {/* Alerta de plan congelado */}
        {hasFrozenPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">Plan Congelado Detectado</h3>
                  <p className="text-gray-300 mb-4">
                    Actualmente tienes el plan <span className="font-bold text-blue-400">{frozenPlanName}</span> congelado.
                    No puedes adquirir nuevos planes mientras tengas un plan congelado.
                  </p>
                  <p className="text-gray-400 text-sm">
                    Por favor contacta al administrador para reactivar tu plan antes de realizar una nueva compra.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Alerta de Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3"
          >
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 text-sm font-medium">Error al iniciar el pago</p>
              <p className="text-red-400/80 text-xs">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1 text-red-400/80 hover:text-red-400">
              <XCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Información del Plan</h2>
              
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.nombre}</h3>
                  <p className="text-gray-400">{plan.descripcion}</p>
                </div>
                {plan.esVip && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-sm font-medium">VIP</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/[0.03] rounded-2xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Duración</p>
                  <p className="text-white font-medium">{plan.duracion}</p>
                </div>
                <div className="bg-white/[0.03] rounded-2xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Precio</p>
                  <p className="text-white font-medium">{formatPrice(plan.precio)}</p>
                </div>
              </div>

              {/* Botón de Pago con Bold */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Pago seguro con Bold</h3>
                      <p className="text-gray-400 text-sm">Serás redirigido a la pasarela de pago</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleProceedToPayment}
                    disabled={isLoading || hasFrozenPlan}
                    className="w-full py-4 gradient-bg rounded-2xl font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {hasFrozenPlan ? (
                      <>
                        <Shield className="w-5 h-5" />
                        Pago Bloqueado - Plan Congelado
                      </>
                    ) : isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Preparando pago...
                      </>
                    ) : (
                      `Pagar ${formatPrice(plan.precio)}`
                    )}
                  </button>
                </div>

                <div className="text-center text-gray-400 text-sm">
                  <p>Al continuar, serás redirigido a Bold para completar tu pago de forma segura.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Resumen */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Resumen del Pedido</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Plan</span>
                  <span className="text-white">{plan.nombre}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Duración</span>
                  <span className="text-white">{plan.duracion}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">{formatPrice(plan.precio)}</span>
                </div>
                
                <div className="border-t border-white/[0.05] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Total</span>
                    <span className="text-2xl font-bold text-white">
                      {formatPrice(plan.precio)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Seguridad</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-gray-300 text-sm">Pago seguro con encriptación SSL</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-300 text-sm">Cancelación en cualquier momento</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
