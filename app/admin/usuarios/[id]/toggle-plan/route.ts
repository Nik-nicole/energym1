import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

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

    // Obtener el usuario a modificar
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            items: {
              include: {
                plan: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Buscar la orden con el plan específico
    const planOrder = user.orders.find(order => 
      order.items.some(item => item.plan?.id === planId)
    );

    if (!planOrder) {
      return NextResponse.json({ error: "Orden con plan no encontrada" }, { status: 404 });
    }

    // Crear o actualizar el UserPlan
    console.log('🔧 Creando/actualizando UserPlan:', { userId: id, planId, isActive });
    
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
          startDate: planOrder.createdAt,
          endDate: new Date(planOrder.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
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
            startDate: planOrder.createdAt,
            endDate: new Date(planOrder.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
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
          }
        },
        _count: {
          select: {
            orders: true,
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
    const allPlanOrders = updatedUser.orders
      .filter(order => order.items.some(item => item.plan))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const paidPlanOrders = allPlanOrders.filter(order => order.paymentStatus === "PAID");
    const latestPlanOrder = paidPlanOrders[0] || allPlanOrders[0];
    const activePlan = latestPlanOrder?.items.find(item => item.plan)?.plan;
    
    let planStatus = null;
    if (latestPlanOrder && activePlan) {
      const isPaid = latestPlanOrder.paymentStatus === "PAID";
      
      // Si el plan fue modificado manualmente, usar ese estado
      const modifiedUserPlan = userPlans.find((up: any) => up.plan.id === activePlan.id);

      if (isPaid) {
        planStatus = {
          id: activePlan.id,
          nombre: activePlan.nombre,
          fechaInicio: latestPlanOrder.createdAt.toISOString().split('T')[0],
          fechaFin: new Date(latestPlanOrder.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isActive: modifiedUserPlan?.isActive ?? true,
          isDeactivated: !(modifiedUserPlan?.isActive ?? true),
        };
      } else {
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
