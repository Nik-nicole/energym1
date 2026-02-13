import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si el usuario es administrador
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // Si no se especifica fecha, usar hoy
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Obtener órdenes del día especificado
    const startDate = new Date(`${targetDate}T00:00:00.000Z`);
    const endDate = new Date(`${targetDate}T23:59:59.999Z`);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        paymentStatus: "PAID", // Solo órdenes pagadas
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                nombre: true,
                imagen: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // Ordenar por estado (pendientes primero)
        { createdAt: 'desc' }, // Luego por fecha
      ],
    });

    return NextResponse.json({
      success: true,
      orders,
      date: targetDate,
      count: orders.length,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Error al obtener las órdenes" },
      { status: 500 }
    );
  }
}
