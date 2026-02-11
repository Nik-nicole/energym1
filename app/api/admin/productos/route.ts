export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET - Obtener todos los productos (con filtros)
export async function GET(request: NextRequest) {
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
        { error: "Solo administradores pueden ver productos" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sedeId = searchParams.get('sedeId');
    const categoria = searchParams.get('categoria');
    const activo = searchParams.get('activo');

    // Construir filtros
    const where: any = {};
    if (sedeId && sedeId !== 'all') where.sedeId = sedeId;
    if (categoria && categoria !== 'all') where.categoria = categoria;
    if (activo !== null) where.activo = activo === 'true';

    const productos = await prisma.producto.findMany({
      where,
      include: {
        sede: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ productos });
  } catch (error) {
    console.error("Error fetching productos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo producto
export async function POST(request: NextRequest) {
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
        { error: "Solo administradores pueden crear productos" },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("Datos recibidos:", body);

    const {
      nombre,
      descripcion,
      precio,
      imagen,
      categoria,
      stock,
      activo,
      destacado
    } = body;

    // Validaciones básicas
    if (!nombre || !descripcion || !precio) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const producto = await prisma.producto.create({
      data: {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        imagen: imagen || null,
        categoria: categoria || 'GENERAL',
        stock: parseInt(stock) || 0,
        activo: activo !== false,
        destacado: destacado === true,
      }
    });

    return NextResponse.json({
      success: true,
      producto
    });
  } catch (error) {
    console.error("Error creating producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
