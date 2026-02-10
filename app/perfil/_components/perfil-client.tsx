"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, MapPin, Mail, Calendar, Shield, Dumbbell, Check, Crown, Package, ShoppingBag, Edit, CreditCard, Settings, Camera, Star, Zap, ArrowLeft, ArrowRight, Sparkles, ChevronDown, X, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
  } | null;
  planes: {
    id: string;
    nombre: string;
    precio: number;
    descripcion: string;
    beneficios: string[];
    duracion: string;
    esVip: boolean;
    destacado?: boolean;
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
      product: {
        id: string;
        nombre: string;
        imagen?: string;
      };
    }[];
  }[];
}

export function PerfilClient({ user, planes, orders }: PerfilClientProps) {
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
  const [plansExpanded, setPlansExpanded] = useState<{ [key: string]: boolean }>({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Simular plan activo (en una implementación real, esto vendría de la base de datos)
  const activePlan = orders.length > 0 ? {
    nombre: "VIP Elite",
    precio: 149900,
    duracion: "mes",
    fechaInicio: orders[0].createdAt,
    fechaFin: new Date(orders[0].createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
    beneficios: [
      "Acceso ilimitado a todas las sedes",
      "Clases personalizadas con entrenador",
      "Acceso a área VIP y spa",
      "Evaluación física mensual",
      "Nutricionista incluido",
      "Descuentos en tienda y productos"
    ]
  } : {
    nombre: "Básico",
    precio: 0,
    duracion: "mes",
    fechaInicio: new Date(),
    fechaFin: new Date(),
    beneficios: [
      "Acceso a una sede",
      "Uso de equipos básicos",
      "Horarios restringidos"
    ]
  };

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
      <div className="relative h-[210px] bg-gradient-to-br from-[#040AE0] via-[#D604E0] to-[#040AE0] w-full">
        {/* Botón de editar perfil */}
        <button 
          onClick={() => setIsEditingProfile(true)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
        >
          <Edit className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* FOTO DE PERFIL */}
        <div className="relative -mt-16 mb-6">
          <div className="w-32 h-32 bg-zinc-800 rounded-full border-4 border-zinc-950 shadow-xl overflow-hidden mx-auto">
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

            {/* Columna Derecha - Plan Activo */}
            <div className="text-center md:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full">
                <Crown className={`w-4 h-4 ${activePlan.nombre === "VIP Elite" ? "text-[#EC4899]" : "text-gray-400"}`} />
                <span className="text-white">Plan Actual</span>
              </div>
              <p className={`font-bold mt-2 ${activePlan.nombre === "VIP Elite" ? "text-[#EC4899]" : "text-gray-400"}`}>
                {activePlan.nombre}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {formatPrice(activePlan.precio)}/{activePlan.duracion}
              </p>
            </div>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
        </div>

        {/* TARJETA DEL PLAN ACTUAL */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-5 h-5 text-white" />
                <span className="text-lg font-bold text-white">Tu Plan Actual</span>
              </div>
              <h2 className={`text-2xl font-bold ${activePlan.nombre === "VIP Elite" ? "bg-gradient-to-r from-[#0047AB] to-[#EC4899] bg-clip-text text-transparent" : "text-gray-400"}`}>
                {activePlan.nombre}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {formatPrice(activePlan.precio)}/{activePlan.duracion}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${activePlan.nombre === "VIP Elite" ? "bg-green-500" : "bg-yellow-500"}`}></div>
              <span className="text-gray-400 text-sm">
                {activePlan.nombre === "VIP Elite" ? "Activo" : "Básico"}
              </span>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Inicio</p>
              <p className="text-sm font-semibold text-gray-200">
                {formatDate(activePlan.fechaInicio)}
              </p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Finaliza</p>
              <p className="text-sm font-semibold text-gray-200">
                {formatDate(activePlan.fechaFin)}
              </p>
            </div>
          </div>

          {/* Beneficios del plan */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-400 mb-3">Beneficios incluidos:</p>
            <div className="space-y-2">
              {activePlan.beneficios.slice(0, 3).map((beneficio, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className={`w-4 h-4 ${activePlan.nombre === "VIP Elite" ? "text-[#EC4899]" : "text-gray-500"}`} />
                  <span>{beneficio}</span>
                </div>
              ))}
              {activePlan.beneficios.length > 3 && (
                <p className="text-xs text-gray-500">+{activePlan.beneficios.length - 3} beneficios más...</p>
              )}
            </div>
          </div>

          {/* Botón de Actualizar Plan */}
          {activePlan.nombre === "Básico" && (
            <button
              onClick={() => {
                const planesSection = document.getElementById('planes-disponibles');
                planesSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-fuchsia-600 text-white font-medium rounded-xl hover:from-blue-500 hover:to-fuchsia-500 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Actualizar Plan
            </button>
          )}
        </div>

        {/* SECCIÓN DE PLANES DISPONIBLES */}
        <div id="planes-disponibles">
          <h3 className="text-xl font-bold text-white mb-6">Planes Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(planes ?? []).map((plan, index) => {
              const planId = plan?.id ?? `plan-${index}`;
              const isExpanded = plansExpanded[planId] || false;
              
              return (
                <motion.div
                  key={planId}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative rounded-2xl p-6 transition-all duration-300 ${
                    plan?.esVip
                      ? "bg-gradient-to-br from-[#D604E0]/20 to-[#040AE0]/20 border-2 border-[#D604E0]/50"
                      : "bg-[#141414] border border-white/10 hover:border-white/20"
                  }`}
                >
                  {plan?.esVip && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gradient-bg rounded-full text-sm font-medium flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      VIP
                    </div>
                  )}
                  {plan?.destacado && !plan?.esVip && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#040AE0] rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Popular
                    </div>
                  )}

                  <div className="text-center mb-6 pt-2">
                    <h3 className={`text-xl font-bold mb-2 ${plan?.esVip ? "gradient-text" : "text-white"}`}>
                      {plan?.nombre ?? "Plan"}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">{plan?.descripcion ?? ""}</p>
                    <div className="flex items-end justify-center gap-1">
                      <span className={`text-4xl font-bold ${plan?.esVip ? "gradient-text" : "text-white"}`}>
                        {formatPrice(plan?.precio ?? 0)}
                      </span>
                      <span className="text-gray-400 mb-1">/{plan?.duracion ?? "mes"}</span>
                    </div>
                  </div>

                  <ul className={`space-y-3 mb-6 overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'max-h-96' : 'max-h-32'
                  }`}>
                    {(plan?.beneficios ?? []).map((beneficio, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                        <Check className={`w-5 h-5 flex-shrink-0 ${plan?.esVip ? "text-[#D604E0]" : "text-[#040AE0]"}`} />
                        <span>{beneficio ?? ""}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => window.location.href = `/pago/${plan?.id}`}
                    className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      plan?.esVip
                        ? "gradient-bg hover:opacity-90"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    Seleccionar Plan
                  </button>

                  {/* Flecha desplegable */}
                  <button
                    onClick={() => setPlansExpanded(prev => ({ ...prev, [planId]: !prev[planId] }))}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <ChevronDown className={`w-4 h-4 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </motion.div>
              );
            })}
          </div>
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
    </div>
  );
}
