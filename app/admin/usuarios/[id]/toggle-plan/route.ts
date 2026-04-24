import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

function calculateEndDate(startDate: Date, duration: string): Date | null {
  const normalizedDuration = duration.toLowerCase();
  const amount = parseInt(normalizedDuration) || 1;
  const newEndDate = new Date(startDate);

  if (normalizedDuration.includes('día') || normalizedDuration.includes('dia')) {
    newEndDate.setDate(newEndDate.getDate() + amount);
    return newEndDate;
  }
  if (normalizedDuration.includes('mes')) {
    newEndDate.setMonth(newEndDate.getMonth() + amount);
    return newEndDate;
  }
  if (normalizedDuration.includes('año') || normalizedDuration.includes('year')) {
    newEndDate.setFullYear(newEndDate.getFullYear() + amount);
    return newEndDate;
  }

  if (normalizedDuration.includes('sesion') || normalizedDuration.includes('hora')) {
    return null;
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si el usuario es administrador
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { planId, isActive } = body;

    // Obtener el usuario a modificar con sus órdenes de planes
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        planOrders: {
          include: {
            plan: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Buscar la orden de plan específica
    const planOrder = user.planOrders.find(order => order.planId === planId || order.plan?.id === planId);

    if (!planOrder) {
      return NextResponse.json({ error: "Orden de plan no encontrada" }, { status: 404 });
    }

    // Obtener el plan para calcular la endDate correcta
    const plan = planOrder.plan;

    // Crear o actualizar el UserPlan
    console.log('🔧 Creando/actualizando UserPlan:', { userId: id, planId, isActive });
    
    const startDate = planOrder.createdAt;
    const endDate = plan ? calculateEndDate(startDate, plan.duracion) : null;
    
    try {
      const userPlan = await prisma.userPlan.upsert({
        where: {
          userId_planId: {
            userId: id,
            planId: planId
          }
        },
        update: {
          isActive: isActive,
          updatedAt: new Date()
        },
        create: {
          userId: id,
          planId: planId,
          isActive: isActive,
          startDate: startDate,
          endDate: endDate || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      console.log('✅ UserPlan guardado:', userPlan);
    } catch (error) {
      console.error('❌ Error guardando UserPlan:', error);
      
      // Si falla el upsert, intentar crear directamente
      try {
        const userPlan = await prisma.userPlan.create({
          data: {
            userId: id,
            planId: planId,
            isActive: isActive,
            startDate: startDate,
            endDate: endDate || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        console.log('✅ UserPlan creado (fallback):', userPlan);
      } catch (createError) {
        console.error('❌ Error creando UserPlan (fallback):', createError);
        throw new Error('No se pudo guardar el estado del plan');
      }
    }

    // Obtener el usuario actualizado con el plan (sin relaciones circulares)
    const updatedUser = await prisma.user.findUnique({
      where: { id },
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
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            planOrders: true,
          },
        },
      },
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "Error al obtener usuario actualizado" }, { status: 500 });
    }

    // Obtener UserPlans por separado
    const userPlans = await prisma.userPlan.findMany({
      where: { userId: id },
      include: {
        plan: {
          select: {
            id: true,
            nombre: true,
          }
        }
      }
    });

    // Aplicar la misma lógica de transformación que en getUsersData
    const allPlanOrders = updatedUser.planOrders
      .filter(order => !!order.plan)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const verifiedPlanOrders = allPlanOrders.filter(order => order.status === "VERIFIED");
    const latestPlanOrder = verifiedPlanOrders[0] || allPlanOrders[0];
    const activePlan = latestPlanOrder?.plan;
    
    let planStatus = null;
    if (latestPlanOrder && activePlan) {
      const isVerified = latestPlanOrder.status === "VERIFIED";
      
      const modifiedUserPlan = userPlans.find((up: any) => up.plan.id === activePlan.id);
      const userPlanEndDate = modifiedUserPlan?.endDate 
        ? new Date(modifiedUserPlan.endDate)
        : (activePlan.duracion ? calculateEndDate(new Date(latestPlanOrder.createdAt), activePlan.duracion) : null);
      const isExpired = userPlanEndDate ? userPlanEndDate <= new Date() : false;
      const isActiveStatus = (modifiedUserPlan?.isActive ?? true) && !isExpired && isVerified;

      planStatus = {
        id: activePlan.id,
        nombre: activePlan.nombre,
        fechaInicio: latestPlanOrder.createdAt.toISOString().split('T')[0],
        fechaFin: userPlanEndDate ? userPlanEndDate.toISOString().split('T')[0] : null,
        isActive: isActiveStatus,
        isDeactivated: !isActiveStatus,
      };
    }

    console.log(`🎯 Estado final del plan para usuario ${id}:`, planStatus);

    const userWithPlan = {
      ...updatedUser,
      planActivo: planStatus,
    };

    return NextResponse.json({
      success: true,
      user: userWithPlan,
      message: `Plan ${isActive ? "activado" : "desactivado"} exitosamente`,
    });
  } catch (error) {
    console.error("Error toggling user plan:", error);
    return NextResponse.json(
      { error: "Error al cambiar estado del plan" },
      { status: 500 }
    );
  }
}
