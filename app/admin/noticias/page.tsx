import prisma from "@/lib/db";
import { AdminLayout } from "../_components/admin-layout";
import { NoticiasAdmin } from "./_components/noticias-admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getNoticiasData() {
  try {
    const noticias = await prisma.noticia.findMany({
      include: {
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { fechaPublicacion: "desc" },
    });

    const sedes = await prisma.sede.findMany({
      select: {
        id: true,
        nombre: true,
      },
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });

    return { noticias, sedes };
  } catch (error) {
    console.error("Error fetching noticias:", error);
    return null;
  }
}

export default async function NoticiasPage() {
  const data = await getNoticiasData();

  if (!data) {
    notFound();
  }

  return (
    <AdminLayout>
      <NoticiasAdmin noticias={data.noticias} sedes={data.sedes} />
    </AdminLayout>
  );
}
