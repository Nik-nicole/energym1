"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, Mail, Calendar, Shield, Dumbbell, Check, Crown, Package, ShoppingBag, Edit, CreditCard, Settings, Camera, Star, Zap, ArrowLeft, ArrowRight, Sparkles, ChevronDown, ChevronLeft, ChevronRight, X, Save, Palette, FileText, AlertCircle, Snowflake, Sun, Pause, Play } from "lucide-react";
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
  
  // Obtener el plan actual considerando tanto isActive como status
  const currentUserPlan = user?.userPlans?.find((userPlan) => 
    userPlan.isActive === true && 
    (userPlan.status === 'ACTIVE' || userPlan.status === 'FROZEN') &&
    (userPlan.status === 'FROZEN' || !userPlan.endDate || new Date(userPlan.endDate) > new Date())
  );
  
  const hasActivePlan = !!currentUserPlan;
  const planStatus = currentUserPlan?.status || 'INACTIVE';
  
  console.log("hasActivePlan:", hasActivePlan);
  console.log("currentUserPlan:", currentUserPlan);
  console.log("planStatus:", planStatus);
  
  const activePlan = hasActivePlan && currentUserPlan ? {
    ...currentUserPlan.plan,
    fechaInicio: currentUserPlan.startDate,
    fechaFin: currentUserPlan.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Si no hay endDate, mostrar 30 días desde inicio
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

  const [uploadingImage, setUploadingImage] = useState(false);
  const [freezingPlan, setFreezingPlan] = useState(false);
  const [unfreezingPlan, setUnfreezingPlan] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir imagen');
      }

      toast.success('Imagen de perfil actualizada');
      // Recargar página para mostrar nueva imagen
      window.location.reload();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const scrollToPlans = () => {
    const plansTitle = document.querySelector('[data-plans-title]');
    plansTitle?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFreezePlan = async () => {
    if (!currentUserPlan?.id) return;
    
    setFreezingPlan(true);
    try {
      const response = await fetch(`/api/user-plans/${currentUserPlan.id}/freeze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al congelar el plan');
      }

      toast.success('Plan congelado correctamente');
      // Recargar página para mostrar cambios
      window.location.reload();
    } catch (error) {
      console.error('Error freezing plan:', error);
      toast.error(error instanceof Error ? error.message : 'Error al congelar el plan');
    } finally {
      setFreezingPlan(false);
    }
  };

  const handleUnfreezePlan = async () => {
    if (!currentUserPlan?.id) return;
    
    setUnfreezingPlan(true);
    try {
      const response = await fetch(`/api/user-plans/${currentUserPlan.id}/unfreeze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al descongelar el plan');
      }

      toast.success(`Plan descongelado correctamente. ${data.frozenDays ? `Se extendieron ${data.frozenDays} días.` : ''}`);
      // Recargar página para mostrar cambios
      window.location.reload();
    } catch (error) {
      console.error('Error unfreezing plan:', error);
      toast.error(error instanceof Error ? error.message : 'Error al descongelar el plan');
    } finally {
      setUnfreezingPlan(false);
    }
  };

  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const ordersPerPage = 5;

  // Paginación de órdenes
  const totalOrderPages = Math.ceil((orders?.length || 0) / ordersPerPage);
  const paginatedOrders = orders?.slice(
    (currentOrderPage - 1) * ordersPerPage,
    currentOrderPage * ordersPerPage
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
        return 'Pagado';
      case 'PENDING':
        return 'Pendiente';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
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
        <div className="relative -mt-16 mb-6 w-32 h-32 mx-auto">
          {/* Coronita para usuarios VIP - fuera del div de la imagen, encima */}
          {hasActivePlan && isVipPlan && (
            <div className="absolute -top-1 right-0 z-30">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-full blur-sm opacity-50"></div>
                <div className="relative bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-full p-1.5 shadow-lg border-2 border-zinc-950">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          )}
          
          <div className="w-full h-full bg-zinc-800 rounded-full border-4 border-zinc-950 shadow-xl overflow-hidden relative">
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
            onClick={handleImageClick}
            disabled={uploadingImage}
            className="absolute bottom-0 right-1/2 translate-x-16 p-2 bg-[#0047AB] hover:bg-[#0047AB]/80 disabled:bg-gray-600 rounded-full transition-colors"
          >
            {uploadingImage ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-4 h-4 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageUpload}
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
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
                    planStatus === 'FROZEN' 
                      ? 'bg-blue-900/20 border-blue-800/50' 
                      : 'bg-zinc-900 border-zinc-800'
                  }`}>
                    {planStatus === 'FROZEN' ? (
                      <Snowflake className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Crown className="w-4 h-4 text-[#EC4899]" />
                    )}
                    <span className={`text-white ${
                      planStatus === 'FROZEN' ? 'text-blue-400' : ''
                    }`}>
                      {planStatus === 'FROZEN' ? 'Plan Congelado' : 'Plan Activo'}
                    </span>
                  </div>
                  <p className="font-bold mt-2 text-[#EC4899]">
                    {activePlan?.nombre}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatPrice(activePlan?.precio || 0)}/{activePlan?.duracion}
                  </p>
                  
                  {/* Botones de congelar/descongelar */}
                  <div className="mt-3 space-y-2">
                    {planStatus === 'ACTIVE' ? (
                      <button
                        onClick={handleFreezePlan}
                        disabled={freezingPlan}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {freezingPlan ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Congelando...
                          </>
                        ) : (
                          <>
                            <Snowflake className="w-4 h-4" />
                            Congelar Plan
                          </>
                        )}
                      </button>
                    ) : planStatus === 'FROZEN' ? (
                      <button
                        onClick={handleUnfreezePlan}
                        disabled={unfreezingPlan}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {unfreezingPlan ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Descongelando...
                          </>
                        ) : (
                          <>
                            <Sun className="w-4 h-4" />
                            Descongelar Plan
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
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
          <div className={`bg-zinc-900 border rounded-2xl p-8 mb-8 ${
            planStatus === 'FROZEN' ? 'border-blue-800/50 bg-zinc-900/50' : 'border-zinc-800'
          }`}>
            {/* Header con estado del plan */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className={`text-2xl font-bold mb-2 ${
                  planStatus === 'FROZEN' ? 'text-blue-400' : 'text-fuchsia-400'
                }`}>
                  {activePlan?.nombre}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-thin text-white">
                    {formatPrice(activePlan?.precio || 0)}
                  </span>
                  <span className="text-zinc-400">/{activePlan?.duracion}</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                planStatus === 'FROZEN' 
                  ? 'bg-blue-900/30 border-blue-800/50' 
                  : 'bg-zinc-800 border-zinc-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  planStatus === 'FROZEN' ? 'bg-blue-500' : 'bg-fuchsia-500'
                }`}></div>
                <span className={`text-sm ${
                  planStatus === 'FROZEN' ? 'text-blue-400' : 'text-zinc-300'
                }`}>
                  {planStatus === 'FROZEN' ? 'Congelado' : 'Activo'}
                </span>
              </div>
            </div>

            {/* Información de congelamiento si aplica */}
            {planStatus === 'FROZEN' && currentUserPlan?.freezeDate && (
              <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Snowflake className="w-5 h-5 text-blue-400" />
                  <p className="text-blue-400 font-medium">Plan Congelado</p>
                </div>
                <p className="text-sm text-blue-300">
                  Tu plan está congelado desde el {formatDate(currentUserPlan.freezeDate)}. 
                  El tiempo está pausado y no se consumen días de tu membresía.
                </p>
              </div>
            )}

            {/* Fechas con diseño bonito */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 text-center">
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Inicio</p>
                <p className="text-sm font-medium text-white">
                  {formatDate(activePlan?.fechaInicio || new Date())}
                </p>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 text-center">
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
                  {planStatus === 'FROZEN' ? 'Reanudará' : 'Finaliza'}
                </p>
                <p className="text-sm font-medium text-white">
                  {formatDate(activePlan?.fechaFin || new Date())}
                </p>
              </div>
            </div>

            {/* Todos los beneficios con toque fucsia */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-sm text-zinc-400">Beneficios incluidos:</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  planStatus === 'FROZEN' 
                    ? 'bg-blue-500/10 text-blue-400' 
                    : 'bg-fuchsia-500/10 text-fuchsia-400'
                }`}>
                  {activePlan?.beneficios?.length || 0} beneficios
                </span>
              </div>
              <div className="space-y-2">
                {activePlan?.beneficios.map((beneficio: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 py-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      planStatus === 'FROZEN' 
                        ? 'border-blue-500/30' 
                        : 'border-fuchsia-500/30'
                    }`}>
                      <Check className={`w-2.5 h-2.5 ${
                        planStatus === 'FROZEN' ? 'text-blue-400' : 'text-fuchsia-400'
                      }`} />
                    </div>
                    <span className={`text-sm ${
                      planStatus === 'FROZEN' ? 'text-zinc-400' : 'text-zinc-300'
                    }`}>
                      {beneficio}
                      {planStatus === 'FROZEN' && (
                        <span className="text-blue-400 ml-2 text-xs">(Pausado)</span>
                      )}
                    </span>
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

        {/* HISTORIAL DE COMPRAS */}
        {(orders?.length || 0) > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-[#D604E0]" />
                Historial de Compras
              </h3>
              <span className="text-gray-400 text-sm">
                {orders?.length || 0} {orders?.length === 1 ? 'compra' : 'compras'} en total
              </span>
            </div>

            <div className="space-y-4">
              {paginatedOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                        {order.items?.[0]?.plan ? (
                          <Crown className="w-6 h-6 text-[#D604E0]" />
                        ) : (
                          <Package className="w-6 h-6 text-[#040AE0]" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {order.items?.[0]?.product?.nombre || order.items?.[0]?.plan?.nombre || 'Compra'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Orden #{order.orderNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:text-right">
                      <div>
                        <p className="text-white font-bold">
                          {formatPrice(order.totalAmount || 0)}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalOrderPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentOrderPage(p => Math.max(1, p - 1))}
                  disabled={currentOrderPage === 1}
                  className="p-2 rounded-lg bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {Array.from({ length: totalOrderPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentOrderPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentOrderPage === page
                        ? 'bg-[#D604E0] text-white'
                        : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentOrderPage(p => Math.min(totalOrderPages, p + 1))}
                  disabled={currentOrderPage === totalOrderPages}
                  className="p-2 rounded-lg bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
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
