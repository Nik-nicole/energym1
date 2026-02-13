import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { isActive } = body;

    console.log("Toggle active request:", { userId: params.id, isActive });

    // Primero verificar el estado actual del usuario
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { isActive: true }
    });

    console.log("Current user state:", currentUser);

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        isActive,
      },
    });

    console.log("Updated user from DB:", { id: user.id, isActive: user.isActive });

    // Verificar que el cambio se guardó correctamente
    const verification = await prisma.user.findUnique({
      where: { id: params.id },
      select: { isActive: true }
    });

    console.log("Verification after update:", verification);

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener el usuario actualizado con toda la información necesaria
    const updatedUser = await prisma.user.findUnique({
      where: { id: params.id },
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
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener el plan activo usando la misma lógica que en la página principal
    const latestOrder = updatedUser.orders[0];
    const activePlan = latestOrder?.items.find((item: any) => item.plan)?.plan;
    
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

    // Transform response for frontend compatibility
    const transformedUser = {
      ...updatedUser,
      planActivo: planStatus,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };

    console.log("Final transformed user:", { 
      id: transformedUser.id, 
      isActive: transformedUser.isActive,
      planActivo: transformedUser.planActivo 
    });

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error("Error toggling user active status:", error);
    return NextResponse.json(
      { error: "Error al cambiar estado del usuario" },
      { status: 500 }
    );
  }
}
