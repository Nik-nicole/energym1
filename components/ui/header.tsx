"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Menu, X, Dumbbell, User, LogOut, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status;
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = session?.user?.role === "ADMIN";
  const isAuthenticated = mounted && status === "authenticated";

  const handleSignOut = () => {
    signOut?.({ callbackUrl: "/" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Dumbbell className="w-8 h-8 text-[#D604E0] group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold gradient-text">FitZone</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#sedes" className="text-gray-300 hover:text-white transition-colors">
            Sedes
          </Link>
          <Link href="/#planes" className="text-gray-300 hover:text-white transition-colors">
            Planes
          </Link>
          <Link href="/#noticias" className="text-gray-300 hover:text-white transition-colors">
            Noticias
          </Link>
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="flex items-center gap-1 text-[#D604E0] hover:text-[#E640F0] transition-colors">
                  <Settings className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <Link href="/perfil" className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors">
                <User className="w-4 h-4" />
                Perfil
              </Link>
              <button onClick={handleSignOut} className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                Iniciar Sesión
              </Link>
              <Link href="/registro" className="px-4 py-2 gradient-bg rounded-lg font-medium hover:opacity-90 transition-opacity">
                Registrarse
              </Link>
            </>
          )}
        </nav>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white p-2">
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 border-b border-white/10"
          >
            <nav className="flex flex-col p-4 gap-4">
              <Link href="/#sedes" onClick={() => setMenuOpen(false)} className="text-gray-300 py-2">Sedes</Link>
              <Link href="/#planes" onClick={() => setMenuOpen(false)} className="text-gray-300 py-2">Planes</Link>
              <Link href="/#noticias" onClick={() => setMenuOpen(false)} className="text-gray-300 py-2">Noticias</Link>
              {isAuthenticated ? (
                <>
                  {isAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-[#D604E0] py-2">Panel Admin</Link>}
                  <Link href="/perfil" onClick={() => setMenuOpen(false)} className="text-gray-300 py-2">Mi Perfil</Link>
                  <button onClick={() => { setMenuOpen(false); handleSignOut(); }} className="text-red-400 py-2 text-left">Cerrar Sesión</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="text-gray-300 py-2">Iniciar Sesión</Link>
                  <Link href="/registro" onClick={() => setMenuOpen(false)} className="gradient-bg text-center py-3 rounded-lg font-medium">Registrarse</Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
