"use client";

import { motion } from "framer-motion";
import { User, MapPin, Mail, Calendar, Shield, Dumbbell, Check, Crown } from "lucide-react";
import Link from "next/link";

interface PerfilClientProps {
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    role: string;
    createdAt: Date;
    sede: { id: string; nombre: string; direccion: string } | null;
  } | null;
  planes: {
    id: string;
    nombre: string;
    precio: number;
    descripcion: string;
    beneficios: string[];
    duracion: string;
    esVip: boolean;
  }[];
}

export function PerfilClient({ user, planes }: PerfilClientProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price ?? 0);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="flex-1 pt-24 pb-16">
      <div className="max-w-[1200px] mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
          <p className="text-gray-400">Administra tu información personal</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info del usuario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-[#141414] rounded-2xl p-6 border border-white/10">
              <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-center mb-1">
                {user?.firstName ?? ""} {user?.lastName ?? ""}
              </h2>
              <p className="text-gray-400 text-center text-sm mb-4">{user?.email ?? ""}</p>
              
              {user?.role === "ADMIN" && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="px-3 py-1 bg-[#D604E0]/20 text-[#D604E0] rounded-full text-sm font-medium flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Administrador
                  </span>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail className="w-5 h-5 text-[#040AE0]" />
                  <span className="text-sm">{user?.email ?? ""}</span>
                </div>
                {user?.sede && (
                  <div className="flex items-start gap-3 text-gray-300">
                    <MapPin className="w-5 h-5 text-[#D604E0] flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{user.sede.nombre}</p>
                      <p className="text-xs text-gray-500">{user.sede.direccion}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-300">
                  <Calendar className="w-5 h-5 text-[#040AE0]" />
                  <span className="text-sm">Miembro desde {user?.createdAt ? formatDate(user.createdAt) : ""}</span>
                </div>
              </div>

              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="w-full mt-6 py-3 gradient-bg rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Shield className="w-5 h-5" />
                  Panel de Administración
                </Link>
              )}
            </div>
          </motion.div>

          {/* Planes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-[#141414] rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <Dumbbell className="w-6 h-6 text-[#D604E0]" />
                <h3 className="text-xl font-bold">Planes Disponibles</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(planes ?? []).map((plan) => (
                  <div
                    key={plan?.id ?? ""}
                    className={`rounded-xl p-4 border ${
                      plan?.esVip
                        ? "bg-gradient-to-br from-[#D604E0]/10 to-[#040AE0]/10 border-[#D604E0]/30"
                        : "bg-[#0A0A0A] border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-bold ${plan?.esVip ? "gradient-text" : ""}`}>
                        {plan?.nombre ?? ""}
                      </h4>
                      {plan?.esVip && <Crown className="w-5 h-5 text-[#D604E0]" />}
                    </div>
                    <p className="text-2xl font-bold mb-2">
                      {formatPrice(plan?.precio ?? 0)}
                      <span className="text-sm text-gray-400 font-normal">/{plan?.duracion ?? "mes"}</span>
                    </p>
                    <p className="text-gray-400 text-sm mb-3">{plan?.descripcion ?? ""}</p>
                    <ul className="space-y-1">
                      {(plan?.beneficios ?? []).slice(0, 3).map((b, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
                          <Check className="w-3 h-3 text-[#D604E0]" />
                          {b ?? ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
