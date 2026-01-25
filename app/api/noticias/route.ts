export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const noticias = await prisma.noticia.findMany({
      orderBy: { fechaPublicacion: "desc" },
      include: { sede: { select: { id: true, nombre: true } } },
    });
    return NextResponse.json(noticias);
  } catch (error) {
    console.error("Error fetching noticias:", error);
    return NextResponse.json({ error: "Error al obtener noticias" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { titulo, contenido, resumen, imagen, sedeId, esPromocion, fechaInicio, fechaFin, activo, destacado } = body ?? {};

    const noticia = await prisma.noticia.create({
      data: {
        titulo: titulo ?? "",
        contenido: contenido ?? "",
        resumen,
        imagen,
        sedeId: sedeId || null,
        esPromocion: esPromocion ?? false,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        activo: activo ?? true,
        destacado: destacado ?? false,
      },
      include: { sede: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json(noticia, { status: 201 });
  } catch (error) {
    console.error("Error creating noticia:", error);
    return NextResponse.json({ error: "Error al crear noticia" }, { status: 500 });
  }
}
