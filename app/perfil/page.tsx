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

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        sede: true,
        userPlans: {
          include: {
            plan: true,
          },
        },
      },
    });

    const plans = await prisma.plan.findMany({
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
        <PerfilClient user={user} planes={plans} orders={transformedOrders} />
        <Footer />
      </main>
    );
  } catch (error) {
    console.error("Error de base de datos en perfil:", error);
    
    // Si hay error de conexión, mostrar página con datos básicos
    const fallbackUser = {
      id: session.user.id,
      firstName: (session.user as any).firstName || "Usuario",
      lastName: (session.user as any).lastName || "",
      email: session.user.email || "",
      role: session.user.role || "USER",
      createdAt: new Date(),
      image: (session.user as any).image || null,
      sede: null,
      userPlans: []
    };

    return (
      <main className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 bg-zinc-950 text-white p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-red-400 mb-2">Error de Conexión</h2>
              <p className="text-red-300">
                No podemos conectar con la base de datos en este momento. Por favor, intenta más tarde.
              </p>
            </div>
            <PerfilClient user={fallbackUser} planes={[]} orders={[]} />
          </div>
        </div>
        <Footer />
      </main>
    );
  }
}
