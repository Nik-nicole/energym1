export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Obtener planes del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Primero, vamos a buscar si hay pagos confirmados que podrían representar planes
    const payments = await prisma.$queryRaw`
      SELECT 
        p.*,
        pl.nombre as plan_nombre,
        pl.descripcion as plan_descripcion,
        pl.precio as plan_precio,
        pl.duracion as plan_duracion,
        pl.esVip as plan_esVip
      FROM "Payment" p
      LEFT JOIN "Plan" pl ON CAST(p.planId AS VARCHAR) = pl.id
      WHERE p.userId = ${session.user.id}
      AND p.status = 'CONFIRMED'
      ORDER BY p.createdAt DESC
      LIMIT 10
    ` as any[];

    // Transformar los datos al formato esperado
    const plans = payments.map((payment: any) => ({
      id: payment.id,
      userId: payment.userId,
      planId: payment.planId,
      status: 'ACTIVE', // Consideramos los pagos confirmados como planes activos
      startDate: payment.createdAt,
      endDate: null, // Podríamos calcular esto basado en la duración del plan
      paymentMethod: payment.paymentMethod || 'WOMPI',
      createdAt: payment.createdAt,
      plan: {
        id: payment.planId,
        nombre: payment.plan_nombre || 'Plan Personalizado',
        descripcion: payment.plan_descripcion || 'Plan adquirido',
        precio: payment.plan_precio || 0,
        duracion: payment.plan_duracion || 'mensual',
        esVip: payment.plan_esVip || false
      }
    }));

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching user plans:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
