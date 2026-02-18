import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Estadísticas de productos
    const productOrders = await prisma.productOrder.findMany({
      select: {
        status: true,
        totalPrice: true,
      },
    });

    // Estadísticas de planes
    const planOrders = await prisma.planOrder.findMany({
      select: {
        status: true,
        totalPrice: true,
        plan: {
          select: {
            esVip: true,
          },
        },
      },
    });

    // Estadísticas de usuarios
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true
      }
    });
    const inactiveUsers = totalUsers - activeUsers;

    // Estadísticas de sedes
    const totalSedes = await prisma.sede.count();
    const activeSedes = totalSedes; // Todas las sedes están activas por defecto

    // Estadísticas de planes
    const totalPlans = await prisma.plan.count();
    const activePlans = totalPlans; // Todos los planes están activos por defecto

    // Estadísticas de productos
    const totalProducts = await prisma.producto.count();
    const activeProducts = totalProducts; // Todos los productos están activos por defecto

    // Estadísticas de noticias
    const totalNoticias = await prisma.noticia.count();
    const activeNoticias = totalNoticias; // Todas las noticias están activas por defecto

    // Calcular estadísticas de productos
    const productStats = {
      totalOrders: productOrders.length,
      pending: productOrders.filter(o => o.status === "PENDING").length,
      shipped: productOrders.filter(o => o.status === "SHIPPED").length,
      totalRevenue: productOrders.reduce((total, order) => total + order.totalPrice, 0),
    };

    // Calcular estadísticas de planes
    const planStats = {
      totalOrders: planOrders.length,
      pending: planOrders.filter(o => o.status === "PENDING").length,
      verified: planOrders.filter(o => o.status === "VERIFIED").length,
      totalRevenue: planOrders.reduce((total, order) => total + order.totalPrice, 0),
      vipPlans: planOrders.filter(o => o.plan.esVip).length,
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
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
