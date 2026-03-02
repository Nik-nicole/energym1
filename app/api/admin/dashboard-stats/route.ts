import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaWrapper } from "@/lib/connection-wrapper";
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    return await PrismaWrapper.execute(async () => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.email) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }

      // Batch all database operations to minimize connections
      const [
        user,
        productOrders,
        planOrders,
        totalUsers,
        activeUsers,
        totalSedes,
        totalPlans,
        totalProducts,
        totalNoticias
      ] = await PrismaWrapper.batch([
        // Get user
        () => prisma.user.findUnique({
          where: { email: session.user.email }
        }),
        // Get product orders
        () => prisma.productOrder.findMany({
          select: {
            status: true,
            totalPrice: true,
          },
        }),
        // Get plan orders
        () => prisma.planOrder.findMany({
          select: {
            status: true,
            totalPrice: true,
            plan: {
              select: {
                esVip: true,
              },
            },
          },
        }),
        // Get user counts
        () => prisma.user.count(),
        () => prisma.user.count({
          where: { isActive: true }
        }),
        // Get entity counts
        () => prisma.sede.count(),
        () => prisma.plan.count(),
        () => prisma.producto.count(),
        () => prisma.noticia.count()
      ]);

      if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }

      const inactiveUsers = totalUsers - activeUsers;
      const activeSedes = totalSedes; // Todas las sedes están activas por defecto
      const activePlans = totalPlans; // Todos los planes están activos por defecto
      const activeProducts = totalProducts; // Todos los productos están activos por defecto
      const activeNoticias = totalNoticias; // Todas las noticias están activas por defecto

      // Calcular estadísticas de productos
      const productStats = {
        totalOrders: productOrders.length,
        pending: productOrders.filter((o: any) => o.status === "PENDING").length,
        shipped: productOrders.filter((o: any) => o.status === "SHIPPED").length,
        totalRevenue: productOrders.reduce((total: number, order: any) => total + order.totalPrice, 0),
      };

      // Calcular estadísticas de planes
      const planStats = {
        totalOrders: planOrders.length,
        pending: planOrders.filter((o: any) => o.status === "PENDING").length,
        verified: planOrders.filter((o: any) => o.status === "VERIFIED").length,
        totalRevenue: planOrders.reduce((total: number, order: any) => total + order.totalPrice, 0),
        vipPlans: planOrders.filter((o: any) => o.plan.esVip).length,
      };

      return NextResponse.json({
        success: true,
        productStats,
        planStats,
        userStats: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
        },
        sedeStats: {
          total: totalSedes,
          active: activeSedes,
          inactive: 0, // Todas las sedes están activas
        },
        planStatsOverview: {
          total: totalPlans,
          active: activePlans,
          inactive: 0, // Todos los planes están activos
        },
        productStatsOverview: {
          total: totalProducts,
          active: activeProducts,
          inactive: 0, // Todos los productos están activos
        },
        noticiaStats: {
          total: totalNoticias,
          active: activeNoticias,
          inactive: 0, // Todas las noticias están activas
        },
        lastUpdated: new Date().toISOString(),
      });
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
