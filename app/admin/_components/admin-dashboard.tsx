"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MapPin,
  Package,
  ShoppingBag,
  Newspaper,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  usersCount: number;
  plansCount: number;
  sedesCount: number;
  productosCount: number;
  noticiasCount: number;
  ordersCount: number;
  activeUsers: number;
  inactiveUsers: number;
}

interface RecentUser {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: string;
  createdAt: Date;
}

interface AdminDashboardProps {
  stats: DashboardStats;
  recentUsers: RecentUser[];
}

const statCards = [
  {
    title: "Usuarios",
    value: "usersCount",
    icon: Users,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    href: "/admin/usuarios",
  },
  {
    title: "Sedes",
    value: "sedesCount",
    icon: MapPin,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    href: "/admin/sedes",
  },
  {
    title: "Planes",
    value: "plansCount",
    icon: Package,
    color: "text-[#D604E0]",
    bgColor: "bg-[#D604E0]/20",
    href: "/admin/planes",
  },
  {
    title: "Productos",
    value: "productosCount",
    icon: ShoppingBag,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    href: "/admin/tienda",
  },
  {
    title: "Noticias",
    value: "noticiasCount",
    icon: Newspaper,
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    href: "/admin/noticias",
  },
  {
    title: "Órdenes",
    value: "ordersCount",
    icon: ShoppingCart,
    color: "text-[#040AE0]",
    bgColor: "bg-[#040AE0]/20",
    href: "/admin/ordenes",
  },
];

export function AdminDashboard({ stats, recentUsers }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Dashboard</h1>
        <p className="text-[#A0A0A0]">
          Resumen general del sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const value = stats[stat.value as keyof DashboardStats] as number;
          
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="bg-[#141414] border-[#1E1E1E] hover:bg-[#1E1E1E] hover:card-glow-hover transition-all cursor-pointer card-glow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#F8F8F8]">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-md ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <p className="text-xs text-[#A0A0A0]">
                    Total registrados
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* User Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#141414] border-[#1E1E1E]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#F8F8F8]">Usuarios Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.activeUsers}
            </div>
            <p className="text-xs text-[#A0A0A0]">
              +20% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-[#1E1E1E]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#F8F8F8]">Usuarios Inactivos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.inactiveUsers}
            </div>
            <p className="text-xs text-[#A0A0A0]">
              -5% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-[#1E1E1E]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#F8F8F8]">Total Sedes</CardTitle>
            <MapPin className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.sedesCount}</div>
            <p className="text-xs text-[#A0A0A0]">
              Sedes activas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-[#1E1E1E]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#F8F8F8]">Planes Activos</CardTitle>
            <Package className="h-4 w-4 text-[#D604E0]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.plansCount}</div>
            <p className="text-xs text-[#A0A0A0]">
              Planes disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card className="bg-[#141414] border-[#1E1E1E]">
        <CardHeader>
          <CardTitle className="text-[#F8F8F8]">Usuarios Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border border-[#1E1E1E] rounded-lg bg-[#0A0A0A]"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#1E1E1E] rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#A0A0A0]" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-[#A0A0A0]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                    className={user.role === "ADMIN" ? "gradient-bg text-white" : "bg-[#1E1E1E] text-[#A0A0A0]"}
                  >
                    {user.role}
                  </Badge>
                  <span className="text-sm text-[#A0A0A0]">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
