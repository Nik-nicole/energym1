"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, Mail, Calendar, Shield, Dumbbell, Check, Crown, Package, ShoppingBag, Edit, CreditCard, Settings, Camera, Star, Zap, ArrowLeft, ArrowRight, Sparkles, ChevronDown, X, Save, Palette, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { PlanCards } from "@/components/ui/plan-cards";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PerfilClientProps {
  user: any;
  planes: any[];
  orders: any[];
}

export function PerfilClient({ user, planes, orders }: PerfilClientProps) {
  const { data: session } = useSession();
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

  // Verificar si el usuario tiene un plan activo (basado en UserPlan activos)
  console.log("Usuario:", user);
  console.log("UserPlans:", user?.userPlans);
  
  const hasActivePlan = user?.userPlans?.some((userPlan) => 
    userPlan.isActive && 
    (!userPlan.endDate || new Date(userPlan.endDate) > new Date())
  ) || false;
  
  const activeUserPlan = user?.userPlans?.find((userPlan) => 
    userPlan.isActive && 
    (!userPlan.endDate || new Date(userPlan.endDate) > new Date())
  );
  
  console.log("hasActivePlan:", hasActivePlan);
  console.log("activeUserPlan:", activeUserPlan);
  
  const activePlan = hasActivePlan && activeUserPlan ? {
    ...activeUserPlan.plan,
    fechaInicio: activeUserPlan.startDate,
    fechaFin: activeUserPlan.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Si no hay endDate, mostrar 30 días desde inicio
  } : null;

  console.log("ActivePlan completo:", activePlan);
  console.log("¿Es VIP?:", activePlan?.esVip);
  console.log("Nombre del plan:", activePlan?.nombre);
  console.log("Tipo del plan:", activePlan?.tipo);

  // Lógica mejorada para detectar si es VIP
  const isVipPlan = activePlan?.esVip || 
                     activePlan?.tipo === "VIP" || 
                     activePlan?.nombre?.toLowerCase().includes("premium") ||
                     activePlan?.nombre?.toLowerCase().includes("vip") ||
                     activePlan?.nombre?.toLowerCase().includes("oro") ||
                     activePlan?.nombre?.toLowerCase().includes("platino");

  console.log("¿Es VIP por lógica mejorada?:", isVipPlan);

  const scrollToPlans = () => {
    const plansTitle = document.querySelector('[data-plans-title]');
    plansTitle?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 pb-8">
      {/* BANNER SUPERIOR */}
      <div className="relative h-[210px] bg-gradient-to-br from-[#040AE0] via-[#D604E0] to-[#040AE0] w-full">
        {/* Botón de editar perfil */}
        <button 
          onClick={() => console.log("Editar perfil")}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
        >
          <Edit className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* FOTO DE PERFIL */}
        <div className="relative -mt-16 mb-6">
          {/* Coronita para usuarios VIP - fuera del contenedor */}
          {hasActivePlan && isVipPlan && (
            <div className="absolute -top-4 right-1/6 translate-x-8 z-20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-full blur-sm opacity-50"></div>
                <div className="relative bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-full p-1.5 shadow-lg">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          )}
          
          <div className="w-32 h-32 bg-zinc-800 rounded-full border-4 border-zinc-950 shadow-xl overflow-hidden mx-auto relative">
            {user?.image ? (
              <img
                src={user.image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0047AB]/20 to-[#EC4899]/20 flex items-center justify-center">
                <User className="w-16 h-16 text-white/60" />
              </div>
            )}
          </div>
          
          <button
            onClick={() => console.log("Subir imagen")}
            className="absolute bottom-0 right-1/2 translate-x-16 p-2 bg-[#0047AB] hover:bg-[#0047AB]/80 rounded-full transition-colors"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
          <input
            id="profile-image-input"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={() => console.log("Imagen cambiada")}
            className="hidden"
          />
        </div>

        {/* INFORMACIÓN DEL USUARIO */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            {/* Columna Izquierda */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-1">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-gray-400 mb-4">Miembro de Fitness Elite</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{user?.sede?.nombre || "Sede Centro"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Miembro desde {formatDate(user?.createdAt || new Date())}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha - Estado del Plan */}
            <div className="text-center md:text-right">
              {hasActivePlan ? (
                <>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full">
                    <Crown className="w-4 h-4 text-[#EC4899]" />
                    <span className="text-white">Plan Activo</span>
                  </div>
                  <p className="font-bold mt-2 text-[#EC4899]">
                    {activePlan?.nombre}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatPrice(activePlan?.precio || 0)}/{activePlan?.duracion}
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full">
                    <Dumbbell className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Sin Plan</span>
                  </div>
                  <p className="font-bold mt-2 text-gray-400">
                    Plan Básico
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Gratis
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* TARJETA DEL PLAN ACTIVO */}
        {hasActivePlan ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8">
            {/* Header minimalista con toque fucsia */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-fuchsia-400 mb-2">
                  {activePlan?.nombre}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-thin text-white">
                    {formatPrice(activePlan?.precio || 0)}
                  </span>
                  <span className="text-zinc-400">/{activePlan?.duracion}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700">
                <div className="w-2 h-2 bg-fuchsia-500 rounded-full"></div>
                <span className="text-sm text-zinc-300">Activo</span>
              </div>
            </div>

            {/* Fechas con diseño bonito */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 text-center">
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Inicio</p>
                <p className="text-sm font-medium text-white">
                  {formatDate(activePlan?.fechaInicio || new Date())}
                </p>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 text-center">
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Finaliza</p>
                <p className="text-sm font-medium text-white">
                  {formatDate(activePlan?.fechaFin || new Date())}
                </p>
              </div>
            </div>

            {/* Todos los beneficios con toque fucsia */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-sm text-zinc-400">Beneficios incluidos:</p>
                <span className="text-xs px-2 py-1 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">
                  {activePlan?.beneficios?.length || 0} beneficios
                </span>
              </div>
              <div className="space-y-2">
                {activePlan?.beneficios.map((beneficio: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 py-1">
                    <div className="w-4 h-4 rounded-full border border-fuchsia-500/30 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-fuchsia-400" />
                    </div>
                    <span className="text-sm text-zinc-300">{beneficio}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 text-center">
            <Dumbbell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Escoge tu Plan</h3>
            <p className="text-gray-400 mb-6">
              Actualmente no tienes un plan activo. Selecciona uno de nuestros planes para comenzar tu transformación.
            </p>
            <button
              onClick={scrollToPlans}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-fuchsia-600 text-white font-medium rounded-xl hover:from-blue-500 hover:to-fuchsia-500 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              Ver Planes Disponibles
            </button>
          </div>
        )}

        {/* SECCIÓN DE PLANES DISPONIBLES */}
        <div className="mt-8" data-plans-section>
          <h3 className="text-2xl font-bold text-white mb-6 text-center" data-plans-title>Planes Disponibles</h3>
          <PlanCards 
            planes={planes} 
            hasActivePlan={hasActivePlan}
            activePlan={activePlan}
          />
        </div>
      </div>
    </div>
  );
}
