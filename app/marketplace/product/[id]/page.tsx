import { prisma } from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { ProductDetailClient } from "../../_components/product-detail-client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getProductData(id: string) {
  try {
    const product = await prisma.producto.findUnique({
      where: { id },
      include: {
        sede: {
          select: { id: true, nombre: true }
        }
      }
    });

    if (!product) {
      return null;
    }

    // Obtener productos relacionados
    const relatedProducts = await prisma.producto.findMany({
      where: {
        id: { not: id },
        categoria: product.categoria,
        activo: true
      },
      include: {
        sede: {
          select: { id: true, nombre: true }
        }
      },
      take: 4,
      orderBy: { destacado: "desc" }
    });

    return { product: product as any, relatedProducts: relatedProducts as any };
  } catch (error) {
    console.error("Error fetching product data:", error);
    return null;
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const data = await getProductData(params.id);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <ProductDetailClient product={data.product} relatedProducts={data.relatedProducts} />
      <Footer />
    </main>
  );
}
