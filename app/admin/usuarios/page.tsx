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
        console.log("DEBUG - latestPlanOrder.status:", latestPlanOrder.status);
        const isVerified = latestPlanOrder.status === "VERIFIED";

        // Buscar userPlanState siempre que haya un plan activo
        console.log("DEBUG - Buscando userPlan para userId:", user.id, "planId:", activePlan.id);
        console.log("DEBUG - userPlans disponibles:", userPlans.map((up: any) => ({ userId: up.userId, planId: up.plan.id, status: up.status })));
        
        const userPlanState = userPlans.find(
          (up: any) =>
            up.plan.id === activePlan.id &&
            up.userId === user.id
        );
        
        console.log("DEBUG - userPlanState encontrado:", userPlanState);
        console.log("DEBUG - userPlanState?.id:", userPlanState?.id);

        // Determinar el estado del plan basado en el userPlanState
        let planStatusData: any = {
          id: activePlan.id,
          orderId: latestPlanOrder.id,
          userPlanId: userPlanState?.id,
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
        };

        if (userPlanState) {
          // Si existe userPlanState, usar su estado real
          const status = (userPlanState as any)?.status || 'ACTIVE';
          const isActive = (userPlanState as any)?.isActive || false;
          
          planStatusData = {
            ...planStatusData,
            status,
            isActive: status === 'ACTIVE' && isActive,
            isDeactivated: status === 'INACTIVE' || !isActive,
            isFrozen: status === 'FROZEN',
          };
        } else if (isVerified) {
          // Si no hay userPlanState pero la orden está verificada, crear uno nuevo
          planStatusData = {
            ...planStatusData,
            status: 'ACTIVE',
            isActive: true,
            isDeactivated: false,
            isFrozen: false,
          };
        } else {
          // Si no hay userPlanState y la orden no está verificada
          planStatusData = {
            ...planStatusData,
            status: 'INACTIVE',
            isActive: false,
            isDeactivated: true,
            isFrozen: false,
          };
        }

        planStatus = planStatusData;
        console.log("DEBUG - planStatusData final:", planStatusData);
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

    // ðŸ”¥ SOLUCIÃ“N CRÃTICA PARA PRODUCCIÃ“N
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





