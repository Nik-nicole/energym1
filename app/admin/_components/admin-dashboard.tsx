"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, MapPin, CreditCard, Newspaper, ArrowRight, Settings } from "lucide-react";

interface AdminDashboardProps {
  stats: {
    usersCount: number;
    sedesCount: number;
    planesCount: number;
    noticiasCount: number;
  };
  recentUsers: {
    id: string;
    firstName: string;
    email: string;
    createdAt: Date;
    role: string;
  }[];
}

export function AdminDashboard({ stats, recentUsers }: AdminDashboardProps) {
  const statCards = [
    { label: "Usuarios", value: stats?.usersCount ?? 0, icon: Users, color: "#D604E0" },
    { label: "Sedes", value: stats?.sedesCount ?? 0, icon: MapPin, color: "#040AE0" },
    { label: "Planes", value: stats?.planesCount ?? 0, icon: CreditCard, color: "#D604E0" },
    { label: "Noticias", value: stats?.noticiasCount ?? 0, icon: Newspaper, color: "#040AE0" },
  ];

  const adminSections = [
    { title: "Gestionar Planes", description: "Crear, editar y eliminar planes", href: "/admin/planes", icon: CreditCard },
    { title: "Gestionar Noticias", description: "Publicar y administrar noticias", href: "/admin/noticias", icon: Newspaper },
    { title: "Gestionar Sedes", description: "Administrar información de sedes", href: "/admin/sedes", icon: MapPin },
  ];

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-[1200px] mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-[#D604E0]" />
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
          </div>
          <p className="text-gray-400">Gestiona tu gimnasio desde aquí</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-[#141414] rounded-xl p-6 border border-white/10"
            >
              <stat.icon className="w-8 h-8 mb-3" style={{ color: stat.color }} />
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Secciones de admin */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 space-y-4"
          >
            <h2 className="text-xl font-bold mb-4">Acciones Rápidas</h2>
            {adminSections.map((section, index) => (
              <Link
                key={section.href}
                href={section.href}
                className="block bg-[#141414] rounded-xl p-6 border border-white/10 hover:border-[#D604E0]/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#D604E0]/10 flex items-center justify-center">
                      <section.icon className="w-6 h-6 text-[#D604E0]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-[#D604E0] transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-gray-400 text-sm">{section.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-[#D604E0] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </motion.div>

          {/* Usuarios recientes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-[#141414] rounded-xl p-6 border border-white/10"
          >
            <h2 className="text-xl font-bold mb-4">Usuarios Recientes</h2>
            <div className="space-y-4">
              {(recentUsers ?? []).map((user) => (
                <div key={user?.id ?? ""} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#040AE0]/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#040AE0]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user?.firstName ?? ""}</p>
                    <p className="text-gray-500 text-xs truncate">{user?.email ?? ""}</p>
                  </div>
                  {user?.role === "ADMIN" && (
                    <span className="px-2 py-0.5 bg-[#D604E0]/20 text-[#D604E0] rounded text-xs">Admin</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
