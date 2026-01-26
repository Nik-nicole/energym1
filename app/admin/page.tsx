import { prisma } from "@/lib/db";
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
      ordersCount,
      recentUsers,
      activeUsers,
      inactiveUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.plan.count(),
      prisma.sede.count(),
      prisma.producto.count(),
      prisma.noticia.count(),
      prisma.order.count(),
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
      prisma.user.count({ where: { /* Asumiendo que hay un campo isActive */ } }),
      prisma.user.count({ where: { /* Asumiendo que hay un campo isActive = false */ } }),
    ]);

    return {
      stats: {
        usersCount,
        plansCount,
        sedesCount,
        productosCount,
        noticiasCount,
        ordersCount,
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

export default async function AdminPage() {
  const data = await getDashboardData();

  if (!data) {
    notFound();
  }

  return (
    <AdminLayout>
      <AdminDashboard stats={data.stats} recentUsers={data.recentUsers} />
    </AdminLayout>
  );
}
