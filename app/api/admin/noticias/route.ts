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

    const noticias = await prisma.noticia.findMany({
      include: {
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { fechaPublicacion: "desc" },
    });

    return NextResponse.json(noticias);
  } catch (error) {
    console.error("Error fetching noticias:", error);
    return NextResponse.json(
      { error: "Error al obtener noticias" },
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
      titulo,
      contenido,
      resumen,
      imagen,
      sedeId,
      esPromocion,
      fechaInicio,
      fechaFin,
      activo,
      destacado,
    } = body;

    if (!titulo || !contenido) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const noticia = await prisma.noticia.create({
      data: {
        titulo,
        contenido,
        resumen,
        imagen,
        sedeId: sedeId || null,
        esPromocion,
        fechaInicio: esPromocion && fechaInicio ? new Date(fechaInicio) : null,
        fechaFin: esPromocion && fechaFin ? new Date(fechaFin) : null,
        activo,
        destacado,
      },
      include: {
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(noticia);
  } catch (error) {
    console.error("Error creating noticia:", error);
    return NextResponse.json(
      { error: "Error al crear noticia" },
      { status: 500 }
    );
  }
}
