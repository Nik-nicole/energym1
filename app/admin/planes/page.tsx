import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/ui/header";
import { PlanesAdmin } from "./_components/planes-admin";

export const dynamic = "force-dynamic";

export default async function AdminPlanesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [planes, sedes] = await Promise.all([
    prisma.plan.findMany({
      orderBy: { orden: "asc" },
      include: { sedes: { include: { sede: true } } },
    }),
    prisma.sede.findMany({ where: { activo: true }, select: { id: true, nombre: true } }),
  ]);

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <PlanesAdmin initialPlanes={planes} sedes={sedes} />
    </main>
  );
}
