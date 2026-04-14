// Utilidades para mapear estados de pago

export type PaymentStatus = "PENDING" | "PAID" | "COMPLETED" | "REJECTED" | "FAILED" | "CANCELLED" | "EXPIRED";

export function getPaymentStatusText(status: PaymentStatus): string {
  switch (status) {
    case "PAID":
    case "COMPLETED":
      return "Pagado";
    case "PENDING":
      return "Pendiente";
    case "REJECTED":
    case "FAILED":
      return "Fallido";
    case "CANCELLED":
    case "EXPIRED":
      return "Cancelado";
    default:
      return "Desconocido";
  }
}

export function getOrderStatusText(status: string): string {
  switch (status) {
    case "PAID":
    case "COMPLETED":
      return "Pagado";
    case "PENDING":
      return "Pendiente";
    case "VERIFIED":
      return "Verificado";
    case "PACKED":
      return "Empacado";
    case "SHIPPED":
      return "Enviado";
    case "DELIVERED":
      return "Entregado";
    case "REJECTED":
    case "FAILED":
      return "Fallido";
    case "CANCELLED":
    case "EXPIRED":
      return "Cancelado";
    default:
      return "Desconocido";
  }
}

export function isPaidStatus(status: PaymentStatus): boolean {
  return status === "PAID" || status === "COMPLETED";
}

export function isPendingStatus(status: PaymentStatus): boolean {
  return status === "PENDING";
}

export function isFailedStatus(status: PaymentStatus): boolean {
  return status === "REJECTED" || status === "FAILED";
}

export function isCancelledStatus(status: PaymentStatus): boolean {
  return status === "CANCELLED" || status === "EXPIRED";
}
