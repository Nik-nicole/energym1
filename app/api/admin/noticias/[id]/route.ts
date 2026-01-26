import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

    const noticia = await prisma.noticia.update({
      where: { id: params.id },
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
    console.error("Error updating noticia:", error);
    return NextResponse.json(
      { error: "Error al actualizar noticia" },
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

    await prisma.noticia.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Noticia eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting noticia:", error);
    return NextResponse.json(
      { error: "Error al eliminar noticia" },
      { status: 500 }
    );
  }
}
