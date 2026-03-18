import { sedeQueries, planQueries, productQueries, noticiaQueries } from "@/lib/query-helpers";
import { serializeData } from "@/lib/utils/serialize";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { HeroSection } from "./_components/hero-section";
import { SedesSection } from "./_components/sedes-section";
import { PlanesWrapper } from "./_components/planes-wrapper";
import { HomeStoreSection } from "./_components/home-store-section";
import { MarketplaceSection } from "./_components/marketplace-section";
import { NoticiasSection } from "./_components/noticias-section";
import { CTASection } from "./_components/cta-section";

export const dynamic = "force-dynamic";

// 🔥 OPTIMIZADO: Usar query helpers para reutilizar consultas
async function getData() {
  try {
    const [sedes, planes, productos, noticias] = await Promise.all([
      sedeQueries.all(),
      planQueries.all(),
      productQueries.featured(),
      noticiaQueries.recent(),
    ]);
    return { sedes, planes, productos, noticias };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { sedes: [], planes: [], productos: [], noticias: [] };
  }
}

// 🔥 SOLUCIÓN CRÍTICA PARA PRODUCCIÓN
// Convierte todo a JSON serializable (elimina Date objects)
async function getSafeData() {
  const { sedes, planes, productos, noticias } = await getData();
  return {
    sedes: serializeData(sedes),
    planes: serializeData(planes),
    productos: serializeData(productos),
    noticias: serializeData(noticias),
  };
}

export default async function HomePage() {
  const { sedes, planes, productos, noticias } = await getSafeData();

  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <SedesSection sedes={sedes} />
      <PlanesWrapper planes={planes} />
      <HomeStoreSection productos={productos} />
      <NoticiasSection noticias={noticias} />
      <CTASection />
      <Footer />
    </main>
  );
}
