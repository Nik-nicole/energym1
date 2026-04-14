export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { BoldPollingService } from "@/lib/bold-polling";

export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  const startTime = Date.now();
  
  try {
    const { transactionId } = params;
    
    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId requerido" }, 
        { status: 400 }
      );
    }

    console.log(`[Payment Status] Iniciando consulta para transactionId:`, transactionId);

    // Usar el servicio de polling para consultar y actualizar
    const result = await BoldPollingService.pollAndUpdatePaymentStatus(transactionId);

    const duration = Date.now() - startTime;
    console.log(`[Payment Status] Consulta completada en ${duration}ms`);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          transactionId 
        }, 
        { status: 500 }
      );
    }

    // Devolver respuesta según especificación
    return NextResponse.json({
      status: result.payment?.status,
      amount: result.payment?.amount,
      transactionId,
      ignored: result.ignored,
      boldData: result.boldData
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Payment Status] Error (${duration}ms):`, error);
    
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Error desconocido",
        status: "ERROR"
      },
      { status: 500 }
    );
  }
}
