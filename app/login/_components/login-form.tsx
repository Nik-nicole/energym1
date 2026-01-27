"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mostrar mensaje de error si viene del middleware
    const errorMessage = searchParams.get("message");
    if (errorMessage) {
      setError(errorMessage);
    }

    // Redirigir si ya está logueado
    if (session) {
      if (session.user.role === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/perfil");
      }
    }
  }, [searchParams, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales incorrectas. Intenta de nuevo.");
      } else {
        // Redirigir según el rol del usuario
        const sessionResult = await fetch("/api/auth/session");
        const sessionData = await sessionResult.json();
        
        if (sessionData?.user?.role === "ADMIN") {
          router.replace("/admin");
        } else {
          router.replace("/perfil");
        }
      }
    } catch (err) {
      setError("Error al iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-12 pr-4 py-3 bg-[#141414] border border-white/10 rounded-lg focus:border-[#D604E0] focus:ring-1 focus:ring-[#D604E0] outline-none transition-colors text-white"
            placeholder="tu@email.com"
          />
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-12 pr-4 py-3 bg-[#141414] border border-white/10 rounded-lg focus:border-[#D604E0] focus:ring-1 focus:ring-[#D604E0] outline-none transition-colors text-white"
            placeholder="••••••••"
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
            Iniciando...
          </>
        ) : (
          "Iniciar Sesión"
        )}
      </button>

      <p className="text-center text-gray-400">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-[#D604E0] hover:underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
