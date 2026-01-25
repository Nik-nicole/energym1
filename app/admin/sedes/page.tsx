import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/ui/header";
import { SedesAdmin } from "./_components/sedes-admin";

export const dynamic = "force-dynamic";

export default async function AdminSedesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const sedes = await prisma.sede.findMany({
    orderBy: { nombre: "asc" },
  });

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <SedesAdmin initialSedes={sedes} />
    </main>
  );
}
