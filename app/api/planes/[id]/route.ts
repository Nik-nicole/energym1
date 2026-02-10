export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "ID del plan es requerido" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({
      where: { id: id },
      include: { sedes: { include: { sede: true } } },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error obteniendo plan:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, precio, descripcion, beneficios, duracion, tipo, esVip, activo, destacado, orden, sedeIds } = body ?? {};

    await prisma.planSede.deleteMany({ where: { planId: params.id } });

    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: {
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
        sedes: {
          create: (sedeIds ?? []).map((sedeId: string) => ({ sedeId })),
        },
      },
      include: { sedes: { include: { sede: true } } },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.plan.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json({ error: "Error al eliminar plan" }, { status: 500 });
  }
}
