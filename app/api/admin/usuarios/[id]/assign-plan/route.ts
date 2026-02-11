import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, fechaInicio, fechaFin } = body;

    if (!planId || !fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Por ahora, como no tenemos el modelo UserPlan, simulamos la asignación
    // En una implementación real, necesitaríamos crear el modelo UserPlan

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        nombre: true,
        precio: true,
        duracion: true,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    // Transform response with simulated plan assignment
    const transformedUser = {
      ...user,
      isActive: true,
      planActivo: {
        id: plan.id,
        nombre: plan.nombre,
        fechaInicio,
        fechaFin,
      },
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error("Error assigning plan:", error);
    return NextResponse.json(
      { error: "Error al asignar plan" },
      { status: 500 }
    );
  }
}
