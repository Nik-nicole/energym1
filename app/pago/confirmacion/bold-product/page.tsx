import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Función para obtener detalles del pago desde Bold API
async function getBoldPaymentDetails(reference: string, apiKey: string) {
  try {
    const response = await fetch(`https://integrations.api.bold.co/online/link/v1/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `x-api-key ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[Bold API] Error fetching payment: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`[Bold API] Payment details:`, data);
    return data;
  } catch (error) {
    console.error(`[Bold API] Error:`, error);
    return null;
  }
}

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
    console.log(`[Bold Product Confirm] INICIANDO PROCESAMIENTO - OrderID: ${productOrderId}, Transaction: ${transaction_id}, Status: ${status}`);
    
    try {
      console.log(`[Bold Product Confirm] Paso 1: Buscando orden en BD...`);
      
      // Buscar la orden del producto con su sede (para obtener la API key)
      const productOrder = await prisma.productOrder.findUnique({
        where: { id: productOrderId },
        include: { product: true, user: true, sede: { include: { paymentGateway: true } } },
      });

      console.log(`[Bold Product Confirm] Paso 2: Orden encontrada:`, productOrder ? {
        id: productOrder.id,
        status: productOrder.status,
        sedeId: productOrder.sedeId,
        totalPrice: productOrder.totalPrice,
        boldReference: (productOrder as any).boldReference
      } : 'NO ENCONTRADA');

      if (!productOrder) {
        console.error(`[Bold Product Confirm] ERROR: Orden ${productOrderId} no encontrada en BD`);
        return (
          <main className="min-h-screen flex flex-col bg-[#050505]">
            <Header />
            <div className="flex-1 pt-24 pb-16 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto px-4">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">❌</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Orden no encontrada</h1>
                <p className="text-gray-400 mb-8">No se encontró la orden en el sistema. Contacta soporte.</p>
                <Link href="/marketplace" className="inline-flex items-center gap-2 px-8 py-4 gradient-bg rounded-xl font-semibold text-white">
                  Volver a la tienda
                </Link>
              </div>
            </div>
            <Footer />
          </main>
        );
      }

      if (productOrder.status !== "PENDING") {
        console.log(`[Bold Product Confirm] Orden ya procesada anteriormente. Status actual: ${productOrder.status}`);
      }

      if (productOrder && productOrder.status === "PENDING") {
        console.log(`[Bold Product Confirm] Paso 3: Orden está PENDING, procediendo...`);
        
        // Obtener API key de Bold
        const envVarName = productOrder.sede?.paymentGateway?.cuentaBanco;
        const boldApiKey = envVarName ? process.env[envVarName] : null;
        
        console.log(`[Bold Product Confirm] Paso 4: API Key de Bold:`, boldApiKey ? 'Configurada ✅' : 'NO CONFIGURADA ❌');
        
        // Intentar obtener detalles del pago desde Bold API
        let customerData = {
          customerName: "",
          customerEmail: "",
          shippingPhone: "",
          shippingAddress: "",
          shippingCity: "",
          paymentMethod: "BOLD"
        };
        
        if (boldApiKey) {
          const boldRef = (productOrder as any).boldReference || reference || bold_reference;
          console.log(`[Bold Product Confirm] Paso 5: Consultando Bold API con referencia: ${boldRef}`);
          
          if (boldRef) {
            const boldDetails = await getBoldPaymentDetails(boldRef, boldApiKey);
            console.log(`[Bold Product Confirm] Paso 6: Respuesta de Bold API:`, JSON.stringify(boldDetails, null, 2));
            
            if (boldDetails?.payload) {
              const payload = boldDetails.payload;
              customerData = {
                customerName: payload.customer_data?.full_name || "",
                customerEmail: payload.customer_data?.email || "",
                shippingPhone: payload.customer_data?.phone || "",
                shippingAddress: payload.shipping_address?.address || "",
                shippingCity: payload.shipping_address?.city || "",
                paymentMethod: payload.payment_method || "BOLD"
              };
              console.log(`[Bold Product Confirm] Paso 7: Datos del cliente extraídos:`, customerData);
            } else {
              console.warn(`[Bold Product Confirm] Paso 6: Bold API no retornó payload`);
            }
          } else {
            console.warn(`[Bold Product Confirm] Paso 5: No hay boldReference disponible`);
          }
        } else {
          console.warn(`[Bold Product Confirm] Paso 4: No se pudo obtener API Key. Variable: ${envVarName}`);
        }

        // Crear el payment
        console.log(`[Bold Product Confirm] Paso 8: Creando registro de pago...`);
        
        let payment;
        try {
          payment = await prisma.payment.create({
            data: {
              sedeId: productOrder.sedeId,
              amount: productOrder.totalPrice,
              paymentMethod: customerData.paymentMethod,
              status: "COMPLETED",
              transactionId: transaction_id,
              gatewayResponse: {
                bold_status: status,
                bold_reference: bold_reference || reference,
                productOrderId: productOrderId,
                customer_data: customerData
              },
            },
          });
          console.log(`[Bold Product Confirm] Paso 9: Payment creado exitosamente:`, {
            id: payment.id,
            transactionId: payment.transactionId
          });
        } catch (paymentError: any) {
          console.error(`[Bold Product Confirm] ERROR creando payment:`, paymentError?.message || paymentError);
          throw paymentError;
        }

        // Actualizar la orden con datos del cliente y pago usando SQL raw para campos nuevos
        console.log(`[Bold Product Confirm] Paso 10: Actualizando orden con datos del cliente...`);
        
        try {
          await prisma.$transaction(async (tx) => {
            console.log(`[Bold Product Confirm] Paso 10a: Actualizando status y paymentId...`);
            // Actualizar campos estándar
            await tx.productOrder.update({
              where: { id: productOrderId },
              data: {
                status: "PAID",
                paymentId: payment.id,
              },
            });
            
            // Actualizar campos del webhook (boldReference, customerName, etc.) con SQL raw
            if (customerData.customerName || customerData.customerEmail) {
              console.log(`[Bold Product Confirm] Paso 10b: Actualizando campos de cliente...`);
              await tx.$executeRawUnsafe(`
                UPDATE "ProductOrder" 
                SET 
                  "customerName" = ${customerData.customerName ? `'${customerData.customerName.replace(/'/g, "''")}'` : 'NULL'},
                  "customerEmail" = ${customerData.customerEmail ? `'${customerData.customerEmail.replace(/'/g, "''")}'` : 'NULL'},
                  "shippingPhone" = ${customerData.shippingPhone ? `'${customerData.shippingPhone.replace(/'/g, "''")}'` : 'NULL'},
                  "shippingAddress" = ${customerData.shippingAddress ? `'${customerData.shippingAddress.replace(/'/g, "''")}'` : 'NULL'},
                  "shippingCity" = ${customerData.shippingCity ? `'${customerData.shippingCity.replace(/'/g, "''")}'` : 'NULL'}
                WHERE id = '${productOrderId}'
              `);
            }
          });
          console.log(`[Bold Product Confirm] Paso 11: Orden actualizada exitosamente ✅`);
        } catch (updateError: any) {
          console.error(`[Bold Product Confirm] ERROR actualizando orden:`, updateError?.message || updateError);
          throw updateError;
        }

        // Actualizar el stock del producto
        if (productOrder.productId) {
          console.log(`[Bold Product Confirm] Paso 12: Actualizando stock...`);
          try {
            await prisma.producto.update({
              where: { id: productOrder.productId },
              data: {
                stock: {
                  decrement: productOrder.quantity,
                },
              },
            });
            console.log(`[Bold Product Confirm] Paso 13: Stock actualizado ✅`);
          } catch (stockError: any) {
            console.error(`[Bold Product Confirm] ERROR actualizando stock:`, stockError?.message || stockError);
          }
        }

        console.log(`[Bold Product Confirm] ✅ PROCESAMIENTO COMPLETADO EXITOSAMENTE`);
      }
    } catch (error: any) {
      console.error(`[Bold Product Confirm] ❌ ERROR GENERAL EN PROCESAMIENTO:`, error?.message || error);
      console.error(`[Bold Product Confirm] Stack trace:`, error?.stack);
      
      // Mostrar error en la UI
      return (
        <main className="min-h-screen flex flex-col bg-[#050505]">
          <Header />
          <div className="flex-1 pt-24 pb-16 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Pago recibido</h1>
              <p className="text-gray-400 mb-2">Tu pago fue procesado pero hubo un error al actualizar la orden.</p>
              <p className="text-gray-500 text-sm mb-2">Transaction ID: {transaction_id}</p>
              <p className="text-red-400 text-xs mb-8">Error: {error?.message || 'Error desconocido'}</p>
              <div className="space-y-3">
                <Link href="/perfil" className="inline-flex items-center gap-2 px-8 py-4 gradient-bg rounded-xl font-semibold text-white w-full justify-center">
                  Ver mis órdenes
                </Link>
                <Link href="/marketplace" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 rounded-xl font-semibold text-white w-full justify-center">
                  Seguir comprando
                </Link>
              </div>
            </div>
          </div>
          <Footer />
        </main>
      );
    }
  } else if (!pagoExitoso) {
    console.log(`[Bold Product Confirm] Pago NO exitoso. Status recibido: ${status}`);
  } else if (!transaction_id) {
    console.warn(`[Bold Product Confirm] Falta transaction_id en callback`);
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
