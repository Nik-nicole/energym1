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
      descripcion,
      precio,
      imagen,
      categoria,
      stock,
      activo,
      destacado,
      sedeId,
    } = body;

    if (!nombre || !descripcion || !precio || !sedeId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const producto = await prisma.producto.update({
      where: { id: params.id },
      data: {
        nombre,
        descripcion,
        precio,
        imagen,
        categoria,
        stock,
        activo,
        destacado,
        sedeId,
      },
      include: {
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    return NextResponse.json(producto);
  } catch (error) {
    console.error("Error updating producto:", error);
    return NextResponse.json(
      { error: "Error al actualizar producto" },
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

    await prisma.producto.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Producto eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting producto:", error);
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    );
  }
}
