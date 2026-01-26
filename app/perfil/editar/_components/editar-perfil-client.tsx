"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Shield, 
  Save, 
  Camera, 
  ArrowLeft,
  Check,
  X,
  CreditCard,
  Package
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Sede {
  id: string;
  nombre: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: string;
  createdAt: Date;
  sedeId: string | null;
  sede: { id: string; nombre: string } | null;
}

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  duracion: string;
  esVip: boolean;
}

interface UserPlan {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  paymentMethod: string;
  createdAt: Date;
  plan: Plan;
}

interface EditarPerfilClientProps {
  sedes: Sede[];
}

export function EditarPerfilClient({ sedes }: EditarPerfilClientProps) {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    sedeId: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    console.log("Session status:", status);
    console.log("Session data:", session);
    
    // Simplificado: solo verificar si está autenticado
    if (status === "authenticated" && session) {
      console.log("User is authenticated, loading data");
      const loadData = async () => {
        await Promise.all([fetchUserData(), fetchUserPlans()]);
        setLoading(false);
      };
      
      loadData();
    } else if (status === "unauthenticated") {
      console.log("User is not authenticated, redirecting to login");
      router.push("/login");
    } else {
      // Si está loading, esperar un poco más y luego intentar cargar
      const timer = setTimeout(() => {
        if (session) {
          console.log("Session found after timeout, loading data");
          const loadData = async () => {
            await Promise.all([fetchUserData(), fetchUserPlans()]);
            setLoading(false);
          };
          loadData();
        } else {
          console.log("No session after timeout, redirecting");
          router.push("/login");
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [session, router, mounted, status]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        setFormData({
          firstName: data.user.firstName,
          lastName: data.user.lastName || "",
          email: data.user.email,
          sedeId: data.user.sedeId || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchUserPlans = async () => {
    try {
      const response = await fetch("/api/user/plans");
      if (response.ok) {
        const data = await response.json();
        setUserPlans(data.plans || []);
      }
    } catch (error) {
      console.error("Error fetching user plans:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "El nombre es obligatorio";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        // Actualizar la sesión
        await update();
        
        setTimeout(() => {
          setSuccess(false);
          router.push("/perfil");
        }, 2000);
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || "Error al actualizar el perfil" });
      }
    } catch (error) {
      setErrors({ submit: "Error al actualizar el perfil" });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading || !mounted) {
    return (
      <div className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/perfil"
              className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-light text-white mb-1">Editar Perfil</h1>
              <p className="text-gray-400 text-sm">Actualiza tu información personal</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de edición */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                      <User className="w-12 h-12 text-white/60" />
                    </div>
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mt-3">Cambiar foto de perfil</p>
                </div>

                {/* Campos del formulario */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/[0.03] border rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-all ${
                        errors.firstName ? "border-red-500/30" : "border-white/[0.05]"
                      }`}
                      placeholder="Tu nombre"
                    />
                    {errors.firstName && (
                      <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Apellido
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-all"
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 bg-white/[0.03] border rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-all ${
                        errors.email ? "border-red-500/30" : "border-white/[0.05]"
                      }`}
                      placeholder="tu@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sede Preferida
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="sedeId"
                      value={formData.sedeId}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl text-white focus:outline-none focus:border-white/20 transition-all appearance-none"
                    >
                      <option value="">Seleccionar sede</option>
                      {sedes.map(sede => (
                        <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mensajes de éxito/error */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3"
                  >
                    <Check className="w-5 h-5 text-green-500" />
                    <p className="text-green-500">Perfil actualizado exitosamente</p>
                  </motion.div>
                )}

                {errors.submit && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3"
                  >
                    <X className="w-5 h-5 text-red-500" />
                    <p className="text-red-500">{errors.submit}</p>
                  </motion.div>
                )}

                {/* Botones */}
                <div className="flex gap-4 pt-4">
                  <Link
                    href="/perfil"
                    className="px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] rounded-2xl font-medium text-white transition-colors"
                  >
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-white/10 rounded-2xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Información adicional */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Información de la cuenta */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
              <h3 className="text-lg font-light text-white mb-4">Información de la Cuenta</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/[0.05] rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white/60" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Tipo de cuenta</p>
                    <p className="text-white capitalize">{userProfile?.role || 'Cliente'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/[0.05] rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white/60" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Miembro desde</p>
                    <p className="text-white">
                      {userProfile ? formatDate(userProfile.createdAt) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Planes comprados */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
              <h3 className="text-lg font-light text-white mb-4">Mis Planes</h3>
              {userPlans.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No tienes planes activos</p>
                  <Link
                    href="/planes"
                    className="inline-block mt-3 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl text-sm text-white transition-colors"
                  >
                    Ver Planes
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {userPlans.map((userPlan) => (
                    <div key={userPlan.id} className="bg-white/[0.03] rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-medium">{userPlan.plan.nombre}</h4>
                          <p className="text-gray-400 text-sm">{userPlan.plan.duracion}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          userPlan.status === 'ACTIVE' 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-gray-500/20 text-gray-500'
                        }`}>
                          {userPlan.status === 'ACTIVE' ? 'Activo' : userPlan.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          {formatDate(userPlan.startDate)}
                        </span>
                        <span className="text-white font-medium">
                          {formatPrice(userPlan.plan.precio)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
