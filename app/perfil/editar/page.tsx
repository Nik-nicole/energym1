import prisma from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { EditarPerfilClient } from "./_components/editar-perfil-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    // Obtener sedes para el selector
    const sedes = await prisma.sede.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
      },
    });

    return { sedes };
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return { sedes: [] };
  }
}

export default async function EditarPerfilPage() {
  const { sedes } = await getData();

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <EditarPerfilClient sedes={sedes} />
      <Footer />
    </main>
  );
}
