import { prisma } from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { HeroSection } from "./_components/hero-section";
import { SedesSection } from "./_components/sedes-section";
import { PlanesSection } from "./_components/planes-section";
import { HomeStoreSection } from "./_components/home-store-section";
import { MarketplaceSection } from "./_components/marketplace-section";
import { NoticiasSection } from "./_components/noticias-section";
import { CTASection } from "./_components/cta-section";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [sedes, planes, productos, noticias] = await Promise.all([
      prisma.sede.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.plan.findMany({
        where: { activo: true },
        orderBy: { orden: "asc" },
        include: { sedes: { include: { sede: true } } },
      }),
      prisma.producto.findMany({
        where: { activo: true },
        orderBy: { destacado: "desc" },
        include: { 
          sede: { 
            select: { id: true, nombre: true } 
          } 
        },
        take: 8,
      }),
      prisma.noticia.findMany({
        where: { activo: true },
        orderBy: { fechaPublicacion: "desc" },
        take: 4,
        include: { sede: { select: { nombre: true } } },
      }),
    ]);
    return { sedes, planes, productos, noticias };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { sedes: [], planes: [], productos: [], noticias: [] };
  }
}

export default async function HomePage() {
  const { sedes, planes, productos, noticias } = await getData();

  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <SedesSection sedes={sedes} />
      <PlanesSection planes={planes} />
      <HomeStoreSection productos={productos as any} />
      <NoticiasSection noticias={noticias} />
      <CTASection />
      <Footer />
    </main>
  );
}
