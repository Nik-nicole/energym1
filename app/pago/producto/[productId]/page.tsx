import prisma from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { PagoProductoClient } from "./_components/pago-producto-client";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getData(productId: string, userSedeId: string | null | undefined) {
  try {
    const product = await prisma.producto.findUnique({
      where: { id: productId, activo: true },
      include: {
        sede: {
          select: {
            id: true,
            nombre: true,
          }
        }
      }
    });

    if (!product) {
      return null;
    }

    // Verificar si el producto está disponible en la sede del usuario
    if (userSedeId && product.sedeId && product.sedeId !== userSedeId) {
      return { product: null, error: "sede_not_available" };
    }

    // Verificar que el producto tenga stock
    if (product.stock <= 0) {
      return { product: null, error: "no_stock" };
    }

    return { product, error: null };
  } catch (error) {
    console.error("Error fetching product data:", error);
    return null;
  }
}

export default async function PagoProductoPage({
  params,
}: {
  params: { productId: string };
}) {
  const session = await getServerSession(authOptions);
  const data = await getData(params.productId, session?.user?.sedeId);

  if (!data) {
    notFound();
  }

  // Si el producto no está disponible en la sede del usuario, redirigir
  if (data.error === "sede_not_available") {
    redirect("/marketplace?error=product_not_available_in_sede");
  }

  // Si el producto no tiene stock, redirigir
  if (data.error === "no_stock") {
    redirect(`/marketplace/product/${params.productId}?error=no_stock`);
  }

  const { product } = data;

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <PagoProductoClient product={product as any} />
      <Footer />
    </main>
  );
}
