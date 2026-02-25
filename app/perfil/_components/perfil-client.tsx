"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, Mail, Calendar, Shield, Dumbbell, Check, Crown, Package, ShoppingBag, Edit, CreditCard, Settings, Camera, Star, Zap, ArrowLeft, ArrowRight, Sparkles, ChevronDown, X, Save, Palette, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { PlanCards } from "@/components/ui/plan-cards";
import { UserOrdersModal } from "@/components/user-orders-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PerfilClientProps {
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    role: string;
    createdAt: Date;
    image?: string | null;
    sede: { id: string; nombre: string; direccion: string } | null;
    userPlans?: Array<{
      id: string;
      userId: string;
      planId: string;
      isActive: boolean;
      startDate: Date;
      endDate: Date | null;
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
      };
    }>;
  } | null;
  planes: {
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
  }[];
  orders: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: Date;
    items: {
      id: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      planId?: string | null;
      productId?: string | null;
      plan?: {
        id: string;
        nombre: string;
        precio: number;
        descripcion: string;
        beneficios: string[];
        duracion: string;
        esVip: boolean;
      } | null;
      product?: {
        id: string;
        nombre: string;
        imagen?: string | null;
      } | null;
    }[];
  }[];
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

  const isAdmin = user?.role === "ADMIN";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [bannerGradient, setBannerGradient] = useState("from-[#040AE0] via-[#D604E0] to-[#040AE0]");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  // Función para recargar datos del usuario
  const reloadUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        console.log("Datos recargados:", data.user);
        // Aquí podrías actualizar el estado del usuario si fuera necesario
        // Por ahora, recargamos la página para asegurar que todo se actualice
        window.location.reload();
      }
    } catch (error) {
      console.error("Error recargando datos:", error);
    }
  };

  const scrollToPlans = () => {
    const plansTitle = document.querySelector('[data-plans-title]');
    plansTitle?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Opciones de gradientes para el banner
  const gradientOptions = [
    { name: "Azul a Rosa", value: "from-[#040AE0] via-[#D604E0] to-[#040AE0]" },
    { name: "Morado a Azul", value: "from-[#8B5CF6] via-[#3B82F6] to-[#8B5CF6]" },
    { name: "Verde a Azul", value: "from-[#10B981] via-[#3B82F6] to-[#10B981]" },
    { name: "Naranja a Rosa", value: "from-[#F97316] via-[#EC4899] to-[#F97316]" },
    { name: "Rojo a Amarillo", value: "from-[#EF4444] via-[#F59E0B] to-[#EF4444]" },
    { name: "Cian a Verde", value: "from-[#06B6D4] via-[#10B981] to-[#06B6D4]" },
  ];

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

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        toast.success('Perfil actualizado exitosamente');
        setIsEditingProfile(false);
        // Recargar la página para mostrar los cambios
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    });
    setIsEditingProfile(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG y WebP');
      return;
    }

    // Validar tamaño (3MB)
    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen no puede pesar más de 3MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Actualizar la imagen en la interfaz
        window.location.reload(); // Recargar para mostrar la nueva imagen
      } else {
        const error = await response.json();
        alert(error.error || 'Error al subir la imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    }
  };

  
  
  return (
    <div className="flex-1 min-h-screen bg-zinc-950 pb-8">
      {/* BANNER SUPERIOR - LLEGA DE LADO A LADO */}
      <div className={`relative h-[210px] bg-gradient-to-br ${bannerGradient} w-full`}>
        {/* Botón de editar perfil */}
        <button 
          onClick={() => setIsEditingProfile(true)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
        >
          <Edit className="w-5 h-5 text-white" />
        </button>
        
        {/* Botón de cambiar color del banner */}
        <button 
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="absolute top-4 right-16 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
        >
          <Palette className="w-5 h-5 text-white" />
        </button>

        {/* Selector de colores */}
        {showColorPicker && (
          <div className="absolute top-16 right-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl z-10">
            <p className="text-white text-sm font-medium mb-3">Color del Banner</p>
            <div className="grid grid-cols-2 gap-2">
              {gradientOptions.map((gradient) => (
                <button
                  key={gradient.value}
                  onClick={() => {
                    setBannerGradient(gradient.value);
                    setShowColorPicker(false);
                  }}
                  className={`h-12 rounded-lg bg-gradient-to-br ${gradient.value} border-2 ${
                    bannerGradient === gradient.value ? 'border-white' : 'border-transparent'
                  } transition-all`}
                  title={gradient.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* FOTO DE PERFIL */}
        <div className="relative -mt-16 mb-6">
          {/* Coronita para usuarios VIP - fuera del contenedor */}
          {hasActivePlan && isVipPlan && (
            <div className="absolute -top-4 left-1/2 -translate-x-17 z-20">
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
            onClick={() => document.getElementById('profile-image-input')?.click()}
            className="absolute bottom-0 right-1/2 translate-x-16 p-2 bg-[#0047AB] hover:bg-[#0047AB]/80 rounded-full transition-colors"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
          <input
            id="profile-image-input"
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

        {/* BOTONES DE ACCIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setIsEditingProfile(true)}
            className="px-6 py-3 bg-white text-zinc-900 font-medium rounded-xl hover:bg-gray-100 transition-all text-sm"
          >
            Editar Perfil
          </button>
          <button
            onClick={() => window.location.href = '/tienda'}
            className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-800 transition-all text-sm"
          >
            Tienda
          </button>
          <button
            onClick={() => setShowOrdersModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#D604E0] to-[#040AE0] text-white font-medium rounded-xl hover:opacity-90 transition-all text-sm"
          >
            Ver Órdenes de Productos
          </button>
        </div>

        {/* TARJETA DEL PLAN ACTIVO O SELECCIÓN DE PLAN */}
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

        {/* SECCIÓN DE HISTORIAL DE COMPRAS */}
        <div className="mt-12">
          <h3 className="text-lg font-light text-zinc-400 mb-6">Historial de Compras</h3>
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-800/50 rounded-full flex items-center justify-center">
                        {order.items[0]?.plan ? (
                          <Crown className="w-4 h-4 text-fuchsia-400/70" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 text-zinc-400/70" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-300">
                          {order.items[0]?.plan ? `Plan: ${order.items[0].plan.nombre}` : order.orderNumber}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-light text-zinc-300">
                        {formatPrice(order.totalAmount)}
                      </p>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-light ${
                          order.paymentStatus === "PAID" 
                            ? "bg-fuchsia-500/10 text-fuchsia-400/80" 
                            : "bg-zinc-700/50 text-zinc-400"
                        }`}>
                          {order.paymentStatus === "PAID" ? "Pagado" : "Pendiente"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 text-center">
              <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-light text-zinc-400 mb-2">No tienes compras aún</h3>
              <p className="text-zinc-500 text-sm mb-6">
                Visita nuestro marketplace para encontrar los mejores productos y suplementos.
              </p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 rounded-lg hover:bg-zinc-800/70 transition-all text-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                Ir al Marketplace
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición de Perfil */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Editar Perfil</h3>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-[#D604E0] transition-colors"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-[#D604E0] transition-colors"
                  placeholder="Tu apellido"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-[#D604E0] transition-colors"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 bg-zinc-800 text-gray-400 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleProfileUpdate}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#040AE0] to-[#D604E0] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Orders Modal */}
      <UserOrdersModal 
        open={showOrdersModal} 
        onOpenChange={setShowOrdersModal} 
      />
    </div>
  );
}
