import { prisma } from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { MarketplaceClient } from "./_components/marketplace-client";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [productos, sedes] = await Promise.all([
      prisma.producto.findMany({
        where: { activo: true },
        orderBy: { destacado: "desc" },
        include: { 
          sede: { 
            select: { id: true, nombre: true } 
          } 
        },
      }),
      prisma.sede.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true },
      }),
    ]);

    return { productos, sedes };
  } catch (error) {
    console.error("Error fetching marketplace data:", error);
    return { productos: [], sedes: [] };
  }
}

export default async function MarketplacePage() {
  const { productos, sedes } = await getData();

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <MarketplaceClient productos={productos as any} sedes={sedes} />
      <Footer />
    </main>
  );
}
