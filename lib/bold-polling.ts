import prisma from "@/lib/db";

type PaymentStatus = "PENDING" | "PAID" | "REJECTED" | "EXPIRED" | "CANCELLED";

// Estados finales que no deben ser sobrescritos
const FINAL_STATUSES = ["PAID", "REJECTED", "EXPIRED", "CANCELLED"];

// Mapeo de estados de Bold a nuestro sistema
const STATUS_MAP: Record<string, PaymentStatus> = {
  "approved": "PAID",
  "paid": "PAID",
  "rejected": "REJECTED",
  "failed": "REJECTED",
  "expired": "EXPIRED",
  "voided": "CANCELLED",
  "cancelled": "CANCELLED",
  "processing": "PENDING",
  "active": "PENDING",
  "pending": "PENDING",
};

export class BoldPollingService {
  
  /**
   * Consulta el estado del pago desde la API de Bold
   */
  static async getPaymentFromBold(paymentLinkId: string, apiKey: string) {
    // Usamos el paymentLinkId de Bold para consultar el estado directamente
    const boldApiUrl = `https://integrations.api.bold.co/online/link/v1/${paymentLinkId}`;
    
    console.log(`[BoldPolling] Consultando estado para paymentLinkId: ${paymentLinkId}`);
    
    const response = await fetch(boldApiUrl, {
      method: "GET",
      headers: {
        "Authorization": `x-api-key ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Error en Bold API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[BoldPolling] Respuesta de Bold:`, JSON.stringify(data, null, 2));
    
    return data;
  }

  /**
   * Obtiene la API key de Bold desde la configuración de la sede
   */
  static async getBoldApiKey(sedeId: string): Promise<string> {
    const sede = await prisma.sede.findUnique({
      where: { id: sedeId },
      include: { paymentGateway: true }
    });

    if (!sede?.paymentGateway?.cuentaBanco) {
      throw new Error("La sede no tiene configurada una cuenta de Bold");
    }

    const envVarName = sede.paymentGateway.cuentaBanco;
    const apiKey = process.env[envVarName];

    if (!apiKey || apiKey.length < 10) {
      throw new Error(`API Key de Bold no encontrada en variable: ${envVarName}`);
    }

    return apiKey;
  }

  /**
   * Actualiza el estado del pago en la base de datos
   */
  static async updatePaymentStatus(transactionId: string, boldData: any) {
    console.log(`[BoldPolling] Actualizando estado para transactionId: ${transactionId}`);

    // Buscar el pago
    const payment = await prisma.payment.findFirst({
      where: { transactionId }
    });

    if (!payment) {
      throw new Error(`Pago no encontrado para transactionId: ${transactionId}`);
    }

    // Mapear estado de Bold a nuestro estado
    const boldStatus = boldData.status?.toLowerCase();
    const newStatus = STATUS_MAP[boldStatus] || "PENDING";

    console.log(`[BoldPolling] Estado Bold: ${boldStatus} -> Estado nuestro: ${newStatus}`);

    // Validar idempotencia: no sobrescribir estados finales
    if (FINAL_STATUSES.includes(payment.status) && payment.status !== newStatus) {
      console.log(`[BoldPolling] Ignorando: estado final ya procesado`, {
        paymentId: payment.id,
        currentStatus: payment.status,
        newStatus: newStatus,
        transactionId
      });
      
      return {
        success: true,
        ignored: true,
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount
        }
      };
    }

    // Actualizar el pago
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        amount: boldData.amount || payment.amount,
        gatewayResponse: boldData,
        updatedAt: new Date()
      }
    });

    console.log(`[BoldPolling] Pago actualizado:`, {
      paymentId: updatedPayment.id,
      transactionId: updatedPayment.transactionId,
      oldStatus: payment.status,
      newStatus: updatedPayment.status
    });

    // Propagar el estado a las órdenes relacionadas
    await this.propagateStatusToOrders(payment.id, newStatus);

    // Si el pago fue aprobado, ejecutar acciones post-pago
    if (newStatus === "PAID") {
      await this.handleSuccessfulPayment(payment.id);
    }

    return {
      success: true,
      ignored: false,
      payment: updatedPayment
    };
  }

  /**
   * Propaga el estado del pago a las órdenes relacionadas
   */
  static async propagateStatusToOrders(paymentId: string, status: PaymentStatus) {
    console.log(`[BoldPolling] Propagando estado ${status} a órdenes del pago ${paymentId}`);

    // Actualizar ProductOrders
    const productOrders = await prisma.productOrder.updateMany({
      where: { paymentId },
      data: { status }
    });

    console.log(`[BoldPolling] ${productOrders.count} ProductOrders actualizadas`);

    // Actualizar PlanOrders
    const planOrders = await prisma.planOrder.updateMany({
      where: { paymentId },
      data: { status }
    });

    console.log(`[BoldPolling] ${planOrders.count} PlanOrders actualizadas`);
  }

  /**
   * Maneja acciones post-pago exitoso
   */
  static async handleSuccessfulPayment(paymentId: string) {
    console.log(`[BoldPolling] Procesando acciones post-pago para ${paymentId}`);

    // Activar planes de usuario
    await this.activateUserPlans(paymentId);

    // Descontar stock de productos
    await this.decrementProductStock(paymentId);
  }

  /**
   * Activa los planes de usuario asociados al pago
   */
  static async activateUserPlans(paymentId: string) {
    const planOrders = await prisma.planOrder.findMany({
      where: { paymentId },
      include: { plan: true }
    });

    for (const planOrder of planOrders) {
      if (!planOrder.plan) continue;

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (planOrder.plan.duracion ? parseInt(planOrder.plan.duracion) : 1));

      await prisma.userPlan.create({
        data: {
          userId: planOrder.userId,
          planId: planOrder.planId,
          paymentId: paymentId,
          startDate,
          endDate,
          isActive: true
        }
      });

      console.log(`[BoldPolling] Plan activado para usuario ${planOrder.userId}`);
    }
  }

  /**
   * Descontar stock de productos vendidos
   */
  static async decrementProductStock(paymentId: string) {
    const productOrders = await prisma.productOrder.findMany({
      where: { paymentId },
      include: { items: true }
    });

    for (const productOrder of productOrders) {
      for (const item of productOrder.items) {
        await prisma.producto.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });

        console.log(`[BoldPolling] Stock descontado: ${item.quantity} unidades del producto ${item.productId}`);
      }
    }
  }

  /**
   * Método principal que hace polling y actualiza el estado
   */
  static async pollAndUpdatePaymentStatus(transactionId: string) {
    try {
      console.log(`[BoldPolling] Iniciando polling para transactionId: ${transactionId}`);

      // Obtener el pago para saber la sede
      const payment = await prisma.payment.findFirst({
        where: { transactionId },
        include: { sede: true }
      });

      if (!payment) {
        throw new Error(`Pago no encontrado para transactionId: ${transactionId}`);
      }

      // Obtener API key de Bold
      const apiKey = await this.getBoldApiKey(payment.sedeId);

      // Consultar estado en Bold
      const boldData = await this.getPaymentFromBold(transactionId, apiKey);

      // Actualizar estado en la base de datos
      const result = await this.updatePaymentStatus(transactionId, boldData);

      console.log(`[BoldPolling] Polling completado para ${transactionId}:`, {
        success: result.success,
        ignored: result.ignored,
        status: result.payment.status
      });

      return {
        success: result.success,
        ignored: result.ignored,
        payment: result.payment,
        boldData
      };

    } catch (error) {
      console.error(`[BoldPolling] Error en polling para ${transactionId}:`, error);
      
      return {
        success: false,
        ignored: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        payment: null
      };
    }
  }
}
