import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { SedeDetailClient } from "./_components/sede-detail-client";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const sedes = await prisma.sede.findMany({ select: { id: true } });
  return sedes.map((sede) => ({ id: sede.id }));
}

async function getSedeData(id: string) {
  try {
    const sede = await prisma.sede.findUnique({
      where: { id },
    });

    if (!sede || !sede.activo) return null;

    const [planes, noticias] = await Promise.all([
      prisma.planSede.findMany({
        where: { sedeId: id },
        include: { plan: true },
      }),
      prisma.noticia.findMany({
        where: {
          OR: [{ sedeId: id }, { sedeId: null }],
          activo: true,
        },
        orderBy: { fechaPublicacion: "desc" },
        take: 3,
        include: { sede: { select: { nombre: true } } },
      }),
    ]);

    return {
      sede,
      planes: planes.map((ps) => ps.plan),
      noticias,
    };
  } catch (error) {
    console.error("Error fetching sede:", error);
    return null;
  }
}

export default async function SedePage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getSedeData(params.id);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <Header />
      <SedeDetailClient
        sede={data.sede}
        planes={data.planes}
        noticias={data.noticias}
      />
      <Footer />
    </main>
  );
}
