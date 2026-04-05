import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Bold redirige aquí con query params: transaction_id, status, reference
export default async function BoldProductConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{
    productOrderId?: string;
    transaction_id?: string;
    status?: string;
    bold_reference?: string;
    reference?: string;
  }>;
}) {
  const { productOrderId, transaction_id, status, bold_reference, reference } = await searchParams;

  if (!productOrderId) {
    redirect("/perfil");
  }

  // Bold envía status: APPROVED, REJECTED, PENDING
  const pagoExitoso = status === "APPROVED";

  if (pagoExitoso && transaction_id) {
    try {
      console.log(`[Bold Product Confirm] Procesando pago exitoso para orden: ${productOrderId}`);
      console.log(`[Bold Product Confirm] Transaction ID: ${transaction_id}`);
      
      // Buscar la orden del producto
      const productOrder = await prisma.productOrder.findUnique({
        where: { id: productOrderId },
        include: { product: true, user: true },
      });

      console.log(`[Bold Product Confirm] Orden encontrada:`, productOrder ? {
        id: productOrder.id,
        status: productOrder.status,
        sedeId: productOrder.sedeId,
        totalPrice: productOrder.totalPrice
      } : 'NO ENCONTRADA');

      if (productOrder && productOrder.status === "PENDING") {
        // Crear el payment
        console.log(`[Bold Product Confirm] Creando payment...`);
        
        const payment = await prisma.payment.create({
          data: {
            sedeId: productOrder.sedeId,
            amount: productOrder.totalPrice,
            paymentMethod: "BOLD",
            status: "COMPLETED",
            transactionId: transaction_id,
            gatewayResponse: {
              bold_status: status,
              bold_reference: bold_reference || reference,
              productOrderId: productOrderId,
            },
          },
        });
        
        console.log(`[Bold Product Confirm] Payment creado:`, {
          id: payment.id,
          transactionId: payment.transactionId,
          amount: payment.amount
        });

        // Actualizar la orden a PAID (los productos usan PAID en lugar de CONFIRMED)
        const updatedOrder = await prisma.productOrder.update({
          where: { id: productOrderId },
          data: {
            status: "PAID",
            paymentId: payment.id,
          },
        });
        
        console.log(`[Bold Product Confirm] Orden actualizada:`, {
          id: updatedOrder.id,
          status: updatedOrder.status,
          paymentId: updatedOrder.paymentId
        });

        // Actualizar el stock del producto
        await prisma.producto.update({
          where: { id: productOrder.productId },
          data: {
            stock: {
              decrement: productOrder.quantity,
            },
          },
        });

        console.log(`[Bold Product Confirm] Orden ${productOrderId} pagada exitosamente. Stock actualizado.`);
      }
    } catch (error) {
      console.error("Error procesando callback Bold para producto:", error);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#050505]">
      <Header />
      <div className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {pagoExitoso ? (
            <>
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✅</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                ¡Pago Exitoso!
              </h1>
              <p className="text-gray-400 mb-2">
                Tu orden de producto ha sido procesada exitosamente.
              </p>
              {transaction_id && (
                <p className="text-gray-500 text-sm mb-8">
                  Referencia: {transaction_id}
                </p>
              )}
              <div className="space-y-3">
                <Link
                  href="/perfil"
                  className="inline-flex items-center gap-2 px-8 py-4 gradient-bg rounded-xl font-semibold text-white hover:opacity-90 transition-opacity w-full justify-center"
                >
                  Ver mis órdenes
                </Link>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 rounded-xl font-semibold text-white hover:bg-white/20 transition-colors w-full justify-center"
                >
                  Seguir comprando
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">❌</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Pago no completado
              </h1>
              <p className="text-gray-400 mb-8">
                {status === "REJECTED"
                  ? "El pago fue rechazado. Por favor intenta con otro método."
                  : "Hubo un problema con tu pago. Por favor intenta nuevamente."}
              </p>
              <div className="space-y-3">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 px-8 py-4 gradient-bg rounded-xl font-semibold text-white hover:opacity-90 transition-opacity w-full justify-center"
                >
                  Volver a la tienda
                </Link>
                <Link
                  href="/perfil"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 rounded-xl font-semibold text-white hover:bg-white/20 transition-colors w-full justify-center"
                >
                  Ver mis órdenes
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
