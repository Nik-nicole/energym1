import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const paymentGateways = await prisma.paymentGateway.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json(paymentGateways);
  } catch (error) {
    console.error("Error fetching payment gateways:", error);
    return NextResponse.json(
      { error: "Error al obtener pasarelas de pago" },
      { status: 500 }
    );
  }
}
