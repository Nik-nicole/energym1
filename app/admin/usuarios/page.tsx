import { prisma } from "@/lib/prisma";
import { withPrismaQuery } from "@/lib/prisma-middleware";
import { AdminLayout } from "../_components/admin-layout";
import { UsuariosAdmin } from "./_components/usuarios-admin";

export const dynamic = "force-dynamic";

async function getUsersData(): Promise<{ users: any[]; sedes: any[]; plans: any[] }> {
  try {
    const users = await withPrismaQuery(async () => {
      return await prisma.user.findMany({
        include: {
          sede: {
            select: {
              id: true,
              nombre: true,
            },
          },
          planOrders: {
            include: {
              plan: {
                select: {
                  id: true,
                  nombre: true,
                  precio: true,
                  duracion: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          productOrders: {
            include: {
              product: {
                select: {
                  id: true,
                  nombre: true,
                  precio: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          _count: {
            select: {
              planOrders: true,
              productOrders: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    });

    const userPlans = await withPrismaQuery(async () => {
      return await prisma.userPlan.findMany({
        include: {
          plan: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });
    });

    const usersWithPlans = users.map((user: any) => {
      const allPlanOrders = user.planOrders || [];
      const verifiedPlanOrders = allPlanOrders.filter(
        (order: any) => order.status === "VERIFIED"
      );

      const latestPlanOrder =
        verifiedPlanOrders[0] || allPlanOrders[0];

      const activePlan = latestPlanOrder?.plan;

      let planStatus = null;

      if (latestPlanOrder && activePlan) {
        const isVerified = latestPlanOrder.status === "VERIFIED";

        if (isVerified) {
          const userPlanState = userPlans.find(
            (up: any) =>
              up.plan.id === activePlan.id &&
              up.userId === user.id
          );

          const isPlanActive = userPlanState
            ? userPlanState.isActive
            : true;

          planStatus = {
            id: activePlan.id,
            nombre: activePlan.nombre,
            fechaInicio: latestPlanOrder.createdAt
              ? new Date(latestPlanOrder.createdAt)
                  .toISOString()
                  .split("T")[0]
              : null,
            fechaFin: latestPlanOrder.createdAt
              ? new Date(
                  new Date(latestPlanOrder.createdAt).getTime() +
                    30 * 24 * 60 * 60 * 1000
                )
                  .toISOString()
                  .split("T")[0]
              : null,
            isActive: isPlanActive,
            isDeactivated: !isPlanActive,
          };
        } else {
          planStatus = {
            id: activePlan.id,
            nombre: activePlan.nombre,
            fechaInicio: latestPlanOrder.createdAt
              ? new Date(latestPlanOrder.createdAt)
                  .toISOString()
                  .split("T")[0]
              : null,
            fechaFin: latestPlanOrder.createdAt
              ? new Date(
                  new Date(latestPlanOrder.createdAt).getTime() +
                    30 * 24 * 60 * 60 * 1000
                )
                  .toISOString()
                  .split("T")[0]
              : null,
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

    const sedes = await withPrismaQuery(async () => {
      return await prisma.sede.findMany({
        select: {
          id: true,
          nombre: true,
        },
        where: { activo: true },
        orderBy: { nombre: "asc" },
      });
    });

    const plans = await withPrismaQuery(async () => {
      return await prisma.plan.findMany({
        select: {
          id: true,
          nombre: true,
          precio: true,
          duracion: true,
        },
        where: { activo: true },
        orderBy: { nombre: "asc" },
      });
    });

    // 🔥 SOLUCIÓN CRÍTICA PARA PRODUCCIÓN
    // Convierte todo a JSON serializable (elimina Date objects)
    const safeUsers = JSON.parse(JSON.stringify(usersWithPlans));
    const safeSedes = JSON.parse(JSON.stringify(sedes));
    const safePlans = JSON.parse(JSON.stringify(plans));

    return {
      users: safeUsers,
      sedes: safeSedes,
      plans: safePlans,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { users: [], sedes: [], plans: [] };
  }
}

export default async function UsuariosPage() {
  const data = await getUsersData();

  return (
    <AdminLayout>
      <UsuariosAdmin
        users={data.users}
        sedes={data.sedes}
        plans={data.plans}
      />
    </AdminLayout>
  );
}