import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/ui/header";
import { AdminDashboard } from "./_components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [usersCount, sedesCount, planesCount, noticiasCount, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.sede.count({ where: { activo: true } }),
    prisma.plan.count({ where: { activo: true } }),
    prisma.noticia.count({ where: { activo: true } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, email: true, createdAt: true, role: true },
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <AdminDashboard
        stats={{ usersCount, sedesCount, planesCount, noticiasCount }}
        recentUsers={recentUsers}
      />
    </main>
  );
}
