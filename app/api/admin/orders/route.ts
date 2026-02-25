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
    const type = searchParams.get('type'); // 'product', 'plan', o 'all'

    // Si no se especifica fecha, usar hoy
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Obtener órdenes del día especificado
    const startDate = new Date(`${targetDate}T00:00:00.000Z`);
    const endDate = new Date(`${targetDate}T23:59:59.999Z`);

    const dateFilter = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    let orders: any[] = [];

    // Obtener órdenes de productos
    if (!type || type === 'all' || type === 'product') {
      const productOrders = await prisma.productOrder.findMany({
        where: {
          ...dateFilter,
          status: "PAID", // Solo órdenes pagadas
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
          product: {
            select: {
              id: true,
              nombre: true,
              imagen: true,
              categoria: true,
            },
          },
          sede: {
            select: {
              id: true,
              nombre: true,
              ciudad: true,
            },
          },
          payment: true,
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
      });

      orders = orders.concat(
        productOrders.map(order => ({
          ...order,
          type: 'product',
          orderType: 'product',
        }))
      );
    }

    // Obtener órdenes de planes
    if (!type || type === 'all' || type === 'plan') {
      const planOrders = await prisma.planOrder.findMany({
        where: {
          ...dateFilter,
          status: "PAID", // Solo órdenes pagadas
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
          plan: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
              esVip: true,
              duracion: true,
            },
          },
          sede: {
            select: {
              id: true,
              nombre: true,
              ciudad: true,
            },
          },
          payment: true,
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
      });

      orders = orders.concat(
        planOrders.map(order => ({
          ...order,
          type: 'plan',
          orderType: 'plan',
        }))
      );
    }

    // Ordenar todas las órdenes por fecha
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
