"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, User, Mail, Calendar, Shield, Check, ArrowLeft } from "lucide-react";
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
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          amount: plan.precio,
          paymentMethod: "CREDIT_CARD",
          cardName: formData.cardName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/pago/confirmacion/${data.paymentId}`);
      } else {
        const error = await response.json();
        alert(error.error || "Error al procesar el pago");
      }
    } catch (error) {
      alert("Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex-1 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/planes"
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

              {/* Formulario de Pago */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre en la tarjeta
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-all"
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Número de tarjeta
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-all"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fecha de vencimiento
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-all"
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-all"
                      placeholder="123"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 gradient-bg rounded-2xl font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Procesando..."
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Pagar {formatPrice(plan.precio)}
                    </>
                  )}
                </button>
              </form>
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
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">IVA (19%)</span>
                  <span className="text-white">{formatPrice(plan.precio * 0.19)}</span>
                </div>
                
                <div className="border-t border-white/[0.05] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Total</span>
                    <span className="text-2xl font-bold text-white">
                      {formatPrice(plan.precio * 1.19)}
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
