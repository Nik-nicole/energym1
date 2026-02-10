import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sedes = await prisma.sede.findMany({
      include: {
        _count: {
          select: {
            usuarios: true,
            productos: true,
            noticias: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(sedes);
  } catch (error) {
    console.error("Error fetching sedes:", error);
    return NextResponse.json(
      { error: "Error al obtener sedes" },
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
      direccion,
      ciudad,
      telefono,
      email,
      descripcion,
      imagen,
      horario,
      activo,
    } = body;

    if (!nombre || !direccion || !ciudad || !telefono || !horario) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const sede = await prisma.sede.create({
      data: {
        nombre,
        direccion,
        ciudad,
        telefono,
        email,
        descripcion,
        imagen,
        horario,
        activo,
      },
      include: {
        _count: {
          select: {
            usuarios: true,
            productos: true,
            noticias: true,
          },
        },
      },
    });

    return NextResponse.json(sede);
  } catch (error) {
    console.error("Error creating sede:", error);
    return NextResponse.json(
      { error: "Error al crear sede" },
      { status: 500 }
    );
  }
}
