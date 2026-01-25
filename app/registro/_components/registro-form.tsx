"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, MapPin, Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface RegistroFormProps {
  sedes: { id: string; nombre: string }[];
}

export function RegistroForm({ sedes }: RegistroFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    sedeId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          sedeId: formData.sedeId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Error al registrar");
        return;
      }

      // Auto login después de registro exitoso
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.replace("/perfil");
      } else {
        router.replace("/login");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
            Nombre
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full pl-12 pr-4 py-3 bg-[#141414] border border-white/10 rounded-lg focus:border-[#D604E0] focus:ring-1 focus:ring-[#D604E0] outline-none transition-colors text-white"
              placeholder="Juan"
            />
          </div>
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
            Apellido
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#141414] border border-white/10 rounded-lg focus:border-[#D604E0] focus:ring-1 focus:ring-[#D604E0] outline-none transition-colors text-white"
            placeholder="Pérez"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full pl-12 pr-4 py-3 bg-[#141414] border border-white/10 rounded-lg focus:border-[#D604E0] focus:ring-1 focus:ring-[#D604E0] outline-none transition-colors text-white"
            placeholder="tu@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="sedeId" className="block text-sm font-medium text-gray-300 mb-2">
          Sede preferida
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <select
            id="sedeId"
            name="sedeId"
            value={formData.sedeId}
            onChange={handleChange}
            className="w-full pl-12 pr-4 py-3 bg-[#141414] border border-white/10 rounded-lg focus:border-[#D604E0] focus:ring-1 focus:ring-[#D604E0] outline-none transition-colors text-white appearance-none"
          >
            <option value="">Selecciona una sede</option>
            {(sedes ?? []).map((sede) => (
              <option key={sede?.id ?? ""} value={sede?.id ?? ""}>
                {sede?.nombre ?? ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full pl-12 pr-4 py-3 bg-[#141414] border border-white/10 rounded-lg focus:border-[#D604E0] focus:ring-1 focus:ring-[#D604E0] outline-none transition-colors text-white"
            placeholder="Mínimo 6 caracteres"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
          Confirmar contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full pl-12 pr-4 py-3 bg-[#141414] border border-white/10 rounded-lg focus:border-[#D604E0] focus:ring-1 focus:ring-[#D604E0] outline-none transition-colors text-white"
            placeholder="Repite tu contraseña"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 gradient-bg rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Crear Cuenta
          </>
        )}
      </button>

      <p className="text-center text-gray-400">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#D604E0] hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
