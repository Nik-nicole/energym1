"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Users,
  MapPin,
  Package,
  ShoppingBag,
  Newspaper,
  Settings,
  LogOut,
  User,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: BarChart3,
  },
  {
    title: "Usuarios",
    href: "/admin/usuarios",
    icon: Users,
  },
  {
    title: "Sedes",
    href: "/admin/sedes",
    icon: MapPin,
  },
  {
    title: "Planes",
    href: "/admin/planes",
    icon: Package,
  },
  {
    title: "Tienda",
    href: "/admin/tienda",
    icon: ShoppingBag,
  },
  {
    title: "Noticias",
    href: "/admin/noticias",
    icon: Newspaper,
  },
  {
    title: "Mi Perfil",
    href: "/admin/perfil",
    icon: User,
  },
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-12 w-48 bg-[#141414] border-r border-[#1E1E1E]", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold gradient-text">
            Panel Admin
          </h2>
          <div className="space-y-1">
            {menuItems.slice(0, -1).map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start text-[#F8F8F8] hover:text-white hover:bg-[#1E1E1E]",
                  pathname === item.href && "bg-[#1E1E1E] text-white gradient-border"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <Separator className="bg-[#1E1E1E]" />
        <div className="px-3 py-2">
          <div className="space-y-1">
            {menuItems.slice(-1).map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start text-[#F8F8F8] hover:text-white hover:bg-[#1E1E1E]",
                  pathname === item.href && "bg-[#1E1E1E] text-white gradient-border"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-500/10"
              asChild
            >
              <Link href="/api/auth/signout">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
