import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const planes = await prisma.plan.findMany({
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
      orderBy: { orden: "asc" },
    });

    return NextResponse.json(planes);
  } catch (error) {
    console.error("Error fetching planes:", error);
    return NextResponse.json(
      { error: "Error al obtener planes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const plan = await prisma.plan.create({
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
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { error: "Error al crear plan" },
      { status: 500 }
    );
  }
}
