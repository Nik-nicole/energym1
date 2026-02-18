import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
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

  // Verificar si el usuario es ADMIN y redirigir al panel administrativo
  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { sede: true },
  });

  const planes = await prisma.plan.findMany({
    where: { 
      activo: true,
      ...(user?.sedeId && {
        sedes: {
          some: {
            sedeId: user.sedeId // Solo planes que están disponibles en la sede del usuario
          }
        }
      })
    },
    include: {
      sedes: {
        include: {
          sede: true
        }
      }
    },
    orderBy: { orden: "asc" },
  });

  // Obtener órdenes de productos del usuario
  const productOrders = await prisma.productOrder.findMany({
    where: { userId: user?.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          nombre: true,
          imagen: true,
        },
      },
      sede: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
    take: 10,
  });

  // Obtener órdenes de planes del usuario
  const planOrders = await prisma.planOrder.findMany({
    where: { userId: user?.id },
    orderBy: { createdAt: "desc" },
    include: {
      plan: {
        select: {
          id: true,
          nombre: true,
          tipo: true,
          duracion: true,
        },
      },
      sede: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
    take: 10,
  });

  // Combinar y transformar ambas órdenes para el componente cliente
  const transformedOrders = [
    ...productOrders.map(order => ({
      id: order.id,
      orderNumber: `PROD-${order.id.slice(-8)}`,
      totalAmount: order.totalPrice,
      status: order.status,
      paymentStatus: order.status === "PENDING" ? "PENDING" : "PAID",
      createdAt: order.createdAt,
      items: [{
        id: order.id,
        quantity: order.quantity,
        unitPrice: order.unitPrice,
        totalPrice: order.totalPrice,
        productId: order.productId,
        product: {
          id: order.product.id,
          nombre: order.product.nombre,
          precio: order.unitPrice,
          descripcion: "",
          beneficios: [],
          duracion: "",
          esVip: false,
        }
      }]
    })),
    ...planOrders.map(order => ({
      id: order.id,
      orderNumber: `PLAN-${order.id.slice(-8)}`,
      totalAmount: order.totalPrice,
      status: order.status,
      paymentStatus: order.status === "PENDING" ? "PENDING" : "PAID",
      createdAt: order.createdAt,
      items: [{
        id: order.id,
        quantity: 1,
        unitPrice: order.unitPrice,
        totalPrice: order.totalPrice,
        planId: order.planId,
        plan: {
          id: order.plan.id,
          nombre: order.plan.nombre,
          precio: order.unitPrice,
          descripcion: "",
          beneficios: [],
          duracion: order.plan.duracion,
          esVip: order.plan.tipo === "VIP",
        }
      }]
    }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <PerfilClient user={user} planes={planes} orders={transformedOrders} />
      <Footer />
    </main>
  );
}
