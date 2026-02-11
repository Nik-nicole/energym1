import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      nombre,
      precio,
      descripcion,
      beneficios,
      duracion,
      tipo,
      esVip,
      activo,
      destacado,
      orden,
      sedeIds,
    } = body;

    if (!nombre || !precio || !descripcion || !duracion) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // First, delete existing PlanSede relationships
    await prisma.planSede.deleteMany({
      where: { planId: params.id },
    });

    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: {
        nombre,
        precio,
        descripcion,
        beneficios: beneficios.filter((b: string) => b.trim() !== ""),
        duracion,
        tipo,
        esVip,
        activo,
        destacado,
        orden,
        sedes: {
          create: sedeIds.map((sedeId: string) => ({
            sedeId,
          })),
        },
      },
      include: {
        sedes: {
          include: {
            sede: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        _count: {
          select: {
            sedes: true,
          },
        },
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: "Error al actualizar plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.plan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Plan eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      { error: "Error al eliminar plan" },
      { status: 500 }
    );
  }
}
