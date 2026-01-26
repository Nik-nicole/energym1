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

    const sede = await prisma.sede.update({
      where: { id: params.id },
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
    console.error("Error updating sede:", error);
    return NextResponse.json(
      { error: "Error al actualizar sede" },
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

    await prisma.sede.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Sede eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting sede:", error);
    return NextResponse.json(
      { error: "Error al eliminar sede" },
      { status: 500 }
    );
  }
}
