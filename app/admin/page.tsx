import prisma from "@/lib/db";
import { AdminLayout } from "./_components/admin-layout";
import { AdminDashboard } from "./_components/admin-dashboard";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  try {
    const [
      usersCount,
      plansCount,
      sedesCount,
      productosCount,
      noticiasCount,
      productOrdersCount,
      planOrdersCount,
      recentUsers,
      activeUsers,
      inactiveUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.plan.count(),
      prisma.sede.count(),
      prisma.producto.count(),
      prisma.noticia.count(),
      prisma.productOrder.count(),
      prisma.planOrder.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
    ]);

    return {
      stats: {
        usersCount,
        plansCount,
        sedesCount,
        productosCount,
        noticiasCount,
        ordersCount: productOrdersCount + planOrdersCount,
        activeUsers,
        inactiveUsers,
      },
      recentUsers,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }
}

const defaultStats = {
  usersCount: 0,
  plansCount: 0,
  sedesCount: 0,
  productosCount: 0,
  noticiasCount: 0,
  ordersCount: 0,
  activeUsers: 0,
  inactiveUsers: 0,
};

export default async function AdminPage() {
  const data = await getDashboardData();

  return (
    <AdminLayout>
      <AdminDashboard stats={data?.stats || defaultStats} recentUsers={data?.recentUsers || []} />
    </AdminLayout>
  );
}
