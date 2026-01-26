export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PUT - Actualizar producto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Solo administradores pueden actualizar productos" },
        { status: 403 }
      );
    }

    const { id } = params;
    const {
      nombre,
      descripcion,
      precio,
      imagen,
      categoria,
      stock,
      activo,
      destacado,
      sedeId
    } = await request.json();

    // Verificar que el producto existe
    const productoExistente = await prisma.producto.findUnique({
      where: { id }
    });

    if (!productoExistente) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Si se cambia de sede, verificar que la nueva sede existe
    if (sedeId && sedeId !== productoExistente.sedeId) {
      const sede = await prisma.sede.findUnique({
        where: { id: sedeId }
      });

      if (!sede) {
        return NextResponse.json(
          { error: "La sede especificada no existe" },
          { status: 400 }
        );
      }
    }

    const producto = await prisma.producto.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion && { descripcion }),
        ...(precio && { precio: parseFloat(precio) }),
        ...(imagen !== undefined && { imagen }),
        ...(categoria && { categoria }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(activo !== undefined && { activo }),
        ...(destacado !== undefined && { destacado }),
        ...(sedeId && { sedeId })
      },
      include: {
        sede: {
          select: { id: true, nombre: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      producto
    });
  } catch (error) {
    console.error("Error updating producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Solo administradores pueden eliminar productos" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verificar que el producto existe
    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        orderItems: true
      }
    });

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que no tenga órdenes asociadas
    if (producto.orderItems.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un producto con órdenes asociadas" },
        { status: 400 }
      );
    }

    // Eliminar imagen de Cloudinary si existe
    if (producto.imagen) {
      try {
        const { deleteImage } = await import("@/lib/cloudinary");
        // Extraer public_id de la URL
        const publicId = producto.imagen.split('/').pop()?.split('.')[0];
        if (publicId) {
          await deleteImage(`fitzone/marketplace/${publicId}`);
        }
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        // No fallar si no se puede eliminar la imagen
      }
    }

    await prisma.producto.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Producto eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error deleting producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
