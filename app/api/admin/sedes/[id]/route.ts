import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { SedeService } from "@/lib/services/sede.service";

export const dynamic = "force-dynamic";

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
    
    // Manejar paymentGatewayId correctamente - si es string vacío, convertir a null
    const updateData = {
      ...body,
      paymentGatewayId: body.paymentGatewayId || null,
    };

    const result = await prisma.sede.update({
      where: { id: params.id },
      data: updateData,
      include: {
        paymentGateway: true,
        _count: {
          select: {
            usuarios: true,
            productos: true,
            noticias: true,
            planesEnSede: true,
          },
        },
      },
    });
    
    return NextResponse.json(result);
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

    const result = await SedeService.deleteSede(params.id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting sede:", error);
    return NextResponse.json(
      { error: "Error al eliminar sede" },
      { status: 500 }
    );
  }
}
