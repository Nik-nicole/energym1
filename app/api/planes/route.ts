export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const planes = await prisma.plan.findMany({
      orderBy: { orden: "asc" },
      include: { sedes: { include: { sede: true } } },
    });
    return NextResponse.json(planes);
  } catch (error) {
    console.error("Error fetching planes:", error);
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, precio, descripcion, beneficios, duracion, tipo, esVip, activo, destacado, orden, sedeIds } = body ?? {};

    const plan = await prisma.plan.create({
      data: {
        nombre: nombre ?? "",
        precio: precio ?? 0,
        descripcion: descripcion ?? "",
        beneficios: beneficios ?? [],
        duracion: duracion ?? "Mensual",
        tipo: tipo ?? "STANDARD",
        esVip: esVip ?? false,
        activo: activo ?? true,
        destacado: destacado ?? false,
        orden: orden ?? 0,
        sedes: {
          create: (sedeIds ?? []).map((sedeId: string) => ({ sedeId })),
        },
      },
      include: { sedes: { include: { sede: true } } },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json({ error: "Error al crear plan" }, { status: 500 });
  }
}
