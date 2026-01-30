export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const noticia = await prisma.noticia.findUnique({
      where: { id: params.id },
      include: { sede: { select: { id: true, nombre: true } } },
    });
    if (!noticia) {
      return NextResponse.json({ error: "Noticia no encontrada" }, { status: 404 });
    }
    return NextResponse.json(noticia);
  } catch (error) {
    console.error("Error fetching noticia:", error);
    return NextResponse.json({ error: "Error al obtener noticia" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { titulo, contenido, resumen, imagen, sedeId, esPromocion, fechaInicio, fechaFin, activo, destacado } = body ?? {};

    const noticia = await prisma.noticia.update({
      where: { id: params.id },
      data: {
        titulo,
        contenido,
        resumen,
        imagen,
        sedeId: sedeId || null,
        esPromocion,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        activo,
        destacado,
      },
      include: { sede: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json(noticia);
  } catch (error) {
    console.error("Error updating noticia:", error);
    return NextResponse.json({ error: "Error al actualizar noticia" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.noticia.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting noticia:", error);
    return NextResponse.json({ error: "Error al eliminar noticia" }, { status: 500 });
  }
}
