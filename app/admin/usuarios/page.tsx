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
                plan: {
                  select: {
                    id: true,
                    nombre: true,
                    precio: true,
                    duracion: true,
                  }
                },
                product: {
                  select: {
                    id: true,
                    nombre: true,
                    precio: true,
                  }
                }
              },
            },
          },
          orderBy: {
            createdAt: 'desc'
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Obtener todos los UserPlans para verificar estados personalizados
    const userPlans = await prisma.userPlan.findMany({
      include: {
        plan: {
          select: {
            id: true,
            nombre: true,
          }
        }
      }
    });

    // Transformar los datos para incluir el plan activo o desactivado
    const usersWithPlans = users.map(user => {
      // Buscar TODAS las órdenes con planes (pagadas y no pagadas), ordenadas por fecha
      const allPlanOrders = user.orders
        .filter(order => order.items.some(item => item.plan))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Buscar específicamente órdenes con planes PAGADAS
      const paidPlanOrders = allPlanOrders.filter(order => order.paymentStatus === "PAID");
      
      // Priorizar: 1) Plan pagado más reciente, 2) Plan más reciente (sin importar pago)
      const latestPlanOrder = paidPlanOrders[0] || allPlanOrders[0];
      
      const activePlan = latestPlanOrder?.items.find(item => item.plan)?.plan;
      
      // Determinar si el plan está activo o desactivado
      let planStatus = null;
      if (latestPlanOrder && activePlan) {
        const isPaid = latestPlanOrder.paymentStatus === "PAID";
        
        if (isPaid) {
          // Plan pagado - siempre mostrar el plan, verificar estado en UserPlan
          const userPlanState = userPlans.find((up: any) => up.plan.id === activePlan.id && up.userId === user.id);
          
          // Siempre mostrar el plan, con su estado correspondiente
          const isActive = userPlanState ? userPlanState.isActive : true; // Por defecto activo si no hay registro
          
          planStatus = {
            id: activePlan.id,
            nombre: activePlan.nombre,
            fechaInicio: latestPlanOrder.createdAt.toISOString().split('T')[0],
            fechaFin: new Date(latestPlanOrder.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isActive: isActive,
            isDeactivated: !isActive, // Simple: si no está activo, está desactivado
          };
          
          console.log(`📋 Plan ${activePlan.nombre} para ${user.firstName}:`, {
            isActive,
            isDeactivated: !isActive,
            userPlanState: userPlanState ? 'exists' : 'not found'
          });
        } else {
          // Plan comprado pero no pagado aún
          planStatus = {
            id: activePlan.id,
            nombre: activePlan.nombre,
            fechaInicio: latestPlanOrder.createdAt.toISOString().split('T')[0],
            fechaFin: new Date(latestPlanOrder.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
