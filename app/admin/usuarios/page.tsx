import prisma from "@/lib/db";
import { AdminLayout } from "../_components/admin-layout";
import { UsuariosAdmin } from "./_components/usuarios-admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getUsersData() {
  try {
    const users = await prisma.user.findMany({
      include: {
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
        orders: {
          include: {
            items: {
              include: {
                plan: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1, // Solo la orden más reciente por usuario
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transformar los datos para incluir el plan activo o desactivado
    const usersWithPlans = users.map(user => {
      const latestOrder = user.orders[0];
      const activePlan = latestOrder?.items.find(item => item.plan)?.plan;
      
      // Determinar si el plan está activo o desactivado
      let planStatus = null;
      if (latestOrder && activePlan) {
        if (latestOrder.status === "CONFIRMED" && latestOrder.paymentStatus === "PAID") {
          planStatus = {
            id: activePlan.id,
            nombre: activePlan.nombre,
            fechaInicio: latestOrder.createdAt.toISOString().split('T')[0],
            fechaFin: new Date(latestOrder.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isActive: true,
            isDeactivated: false,
          };
        } else {
          planStatus = {
            id: activePlan.id,
            nombre: activePlan.nombre,
            fechaInicio: latestOrder.createdAt.toISOString().split('T')[0],
            fechaFin: new Date(latestOrder.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isActive: false,
            isDeactivated: true,
          };
        }
      }
      
      return {
        ...user,
        planActivo: planStatus,
      };
    });

    const sedes = await prisma.sede.findMany({
      select: {
        id: true,
        nombre: true,
      },
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });

    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        nombre: true,
        precio: true,
        duracion: true,
      },
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });

    return { users: usersWithPlans, sedes, plans };
  } catch (error) {
    console.error("Error fetching users:", error);
    return null;
  }
}

export default async function UsuariosPage() {
  const data = await getUsersData();

  if (!data) {
    notFound();
  }

  return (
    <AdminLayout>
      <UsuariosAdmin users={data.users} sedes={data.sedes} plans={data.plans} />
    </AdminLayout>
  );
}
