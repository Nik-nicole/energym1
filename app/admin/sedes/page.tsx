import { prisma } from "@/lib/db";
import { AdminLayout } from "../_components/admin-layout";
import { SedesAdmin } from "./_components/sedes-admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getSedesData() {
  try {
    const sedes = await prisma.sede.findMany({
      include: {
        _count: {
          select: {
            usuarios: true,
            productos: true,
            noticias: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return { sedes };
  } catch (error) {
    console.error("Error fetching sedes:", error);
    return null;
  }
}

export default async function SedesPage() {
  const data = await getSedesData();

  if (!data) {
    notFound();
  }

  return (
    <AdminLayout>
      <SedesAdmin sedes={data.sedes} />
    </AdminLayout>
  );
}
