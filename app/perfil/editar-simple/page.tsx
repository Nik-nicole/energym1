"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, MapPin, Save, ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";

interface Sede {
  id: string;
  nombre: string;
}

export default function EditarPerfilSimple() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    sedeId: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sedes, setSedes] = useState<Sede[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (status === "loading") return;
    
    if (!session) {
      router.push("/login");
      return;
    }
    
    loadData();
  }, [session, router, mounted, status]);

  const loadData = async () => {
    try {
      // Cargar sedes
      const sedesResponse = await fetch("/api/sedes");
      if (sedesResponse.ok) {
        const sedesData = await sedesResponse.json();
        setSedes(sedesData);
      }

      // Cargar datos del usuario
      const userResponse = await fetch("/api/user/profile");
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setFormData({
          firstName: userData.user.firstName,
          lastName: userData.user.lastName || "",
          email: userData.user.email,
          sedeId: userData.user.sedeId || "",
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
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

        {/* Formulario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white/60" />
                </div>
                <p className="text-gray-400 text-sm mt-3">Foto de perfil</p>
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
      </div>
    </div>
  );
}
