import prisma from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { HeroSection } from "./_components/hero-section";
import { SedesSection } from "./_components/sedes-section";
import { PlanesSection } from "./_components/planes-section";
import { NoticiasSection } from "./_components/noticias-section";
import { CTASection } from "./_components/cta-section";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [sedes, planes, noticias] = await Promise.all([
      prisma.sede.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.plan.findMany({
        where: { activo: true },
        orderBy: { orden: "asc" },
        include: { sedes: { include: { sede: true } } },
      }),
      prisma.noticia.findMany({
        where: { activo: true },
        orderBy: { fechaPublicacion: "desc" },
        take: 4,
        include: { sede: { select: { nombre: true } } },
      }),
    ]);
    return { sedes, planes, noticias };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { sedes: [], planes: [], noticias: [] };
  }
}

export default async function HomePage() {
  const { sedes, planes, noticias } = await getData();

  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <SedesSection sedes={sedes} />
      <PlanesSection planes={planes} />
      <NoticiasSection noticias={noticias} />
      <CTASection />
      <Footer />
    </main>
  );
}
