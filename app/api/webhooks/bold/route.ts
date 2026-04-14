export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

// Endpoint GET para indicar que el webhook está desactivado
export async function GET() {
  return NextResponse.json({
    status: "Webhook desactivado - usando polling",
    timestamp: new Date().toISOString(),
    message: "Usa GET /api/payments/[transactionId]/status para consultar estado"
  });
}

// Endpoint POST desactivado - ya no usamos webhooks
export async function POST() {
  return NextResponse.json({
    error: "Webhook desactivado",
    message: "Usa GET /api/payments/[transactionId]/status para consultar estado",
    timestamp: new Date().toISOString()
  }, { status: 404 });
}
