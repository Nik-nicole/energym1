import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { PerfilClient } from "./_components/perfil-client";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { sede: true },
  });

  const planes = await prisma.plan.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  // Intentar obtener pedidos, pero manejar el error si el modelo no existe
  let orders: any[] = [];
  try {
    orders = await prisma.order.findMany({
      where: { userId: user?.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                nombre: true,
                imagen: true,
              },
            },
          },
        },
      },
      take: 10,
    });
  } catch (error) {
    console.log("Model Order not available yet, using empty array");
    orders = [];
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <PerfilClient user={user} planes={planes} orders={orders} />
      <Footer />
    </main>
  );
}
