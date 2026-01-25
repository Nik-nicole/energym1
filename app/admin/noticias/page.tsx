import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/ui/header";
import { NoticiasAdmin } from "./_components/noticias-admin";

export const dynamic = "force-dynamic";

export default async function AdminNoticiasPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [noticias, sedes] = await Promise.all([
    prisma.noticia.findMany({
      orderBy: { fechaPublicacion: "desc" },
      include: { sede: { select: { id: true, nombre: true } } },
    }),
    prisma.sede.findMany({ where: { activo: true }, select: { id: true, nombre: true } }),
  ]);

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <NoticiasAdmin initialNoticias={noticias} sedes={sedes} />
    </main>
  );
}
