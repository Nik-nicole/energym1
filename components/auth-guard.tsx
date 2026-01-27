"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, requireAdmin = true, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (status === "loading" || !isClient) return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (requireAdmin && session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }
  }, [session, status, router, requireAdmin, isClient]);

  // Loading state
  if (status === "loading" || !isClient) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#D604E0] mx-auto mb-4" />
          <p className="text-gray-400">Verificando autorización...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h1>
          <p className="text-gray-400 mb-6">
            Debes iniciar sesión para acceder a esta página.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full gradient-bg hover:opacity-90">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button variant="outline" asChild className="w-full border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white">
              <Link href="/">Volver al Inicio</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated but not admin (when admin is required)
  if (requireAdmin && session.user.role !== "ADMIN") {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h1>
          <p className="text-gray-400 mb-6">
            Esta página es solo para administradores. Tu rol actual es:{" "}
            <span className="text-[#D604E0] font-semibold">{session.user.role}</span>
          </p>
          <div className="space-y-3">
            <Button variant="outline" asChild className="w-full border-[#1E1E1E] text-[#F8F8F8] hover:bg-[#1E1E1E] hover:text-white">
              <Link href="/">Volver al Inicio</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated and authorized
  return <>{children}</>;
}
