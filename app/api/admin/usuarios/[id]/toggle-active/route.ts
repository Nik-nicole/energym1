import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { isActive } = body;

    // Por ahora, como no tenemos el campo isActive en la base de datos,
    // simulamos el cambio de estado. En una implementación real,
    // necesitaríamos agregar el campo isActive al modelo User.

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Transform response with simulated isActive
    const transformedUser = {
      ...user,
      isActive,
      planActivo: null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error("Error toggling user active status:", error);
    return NextResponse.json(
      { error: "Error al cambiar estado del usuario" },
      { status: 500 }
    );
  }
}
