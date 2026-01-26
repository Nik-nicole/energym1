import { prisma } from "@/lib/db";
import { AdminLayout } from "../_components/admin-layout";
import { PlanesAdmin } from "./_components/planes-admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getPlanesData() {
  try {
    const planes = await prisma.plan.findMany({
      include: {
        sedes: {
          include: {
            sede: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        _count: {
          select: {
            sedes: true,
          },
        },
      },
      orderBy: { orden: "asc" },
    });

    const sedes = await prisma.sede.findMany({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: "asc" },
    });

    return { planes, sedes };
  } catch (error) {
    console.error("Error fetching planes:", error);
    return null;
  }
}

export default async function PlanesPage() {
  const data = await getPlanesData();

  if (!data) {
    notFound();
  }

  return (
    <AdminLayout>
      <PlanesAdmin planes={data.planes} sedes={data.sedes} />
    </AdminLayout>
  );
}
