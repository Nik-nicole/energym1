import { NextRequest, NextResponse } from "next/server";
import { BoldPollingService } from "@/lib/bold-polling";

export async function GET() {
  try {
    // Usar el transactionId del pago que hiciste
    const transactionId = "ORD-cmm2734i-1775670233611-576";
    
    console.log(`[Test Polling] Iniciando prueba para transactionId:`, transactionId);
    
    const result = await BoldPollingService.pollAndUpdatePaymentStatus(transactionId);
    
    console.log(`[Test Polling] Resultado:`, JSON.stringify(result, null, 2));
    
    return NextResponse.json({
      success: true,
      message: "Polling test completado",
      result
    });
    
  } catch (error) {
    console.error(`[Test Polling] Error:`, error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 });
  }
}
