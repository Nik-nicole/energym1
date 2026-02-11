import prisma from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { MarketplaceSidebarFixed } from "./_components/marketplace-sidebar-fixed";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      orderBy: { destacado: "desc" },
    });

    return { productos };
  } catch (error) {
    console.error("Error fetching marketplace data:", error);
    return { productos: [] };
  }
}

export default async function MarketplacePage() {
  const { productos } = await getData();

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <MarketplaceSidebarFixed productos={productos as any} />
      <Footer />
    </main>
  );
}
