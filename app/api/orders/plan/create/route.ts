import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userQueries } from "@/lib/query-helpers";
import { OrderService } from "@/lib/services/order.service";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el usuario
    const user = await userQueries.byEmail(session.user.email);

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const result = await OrderService.createPlanOrder(user.id, body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating plan order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al activar el plan" },
      { status: 500 }
    );
  }
}
