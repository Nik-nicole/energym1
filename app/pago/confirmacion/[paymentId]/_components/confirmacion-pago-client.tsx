"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  Check, 
  Calendar, 
  CreditCard, 
  Download,
  Share,
  ArrowLeft,
  User,
  ShoppingBag,
  Package,
  Home,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    id: string;
    nombre: string;
    imagen?: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  items: OrderItem[];
}

interface Payment {
  id: string;
  transactionId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: Date;
  order: Order;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    phone: string;
  };
}

interface ConfirmacionPagoClientProps {
  payment: Payment;
}

export function ConfirmacionPagoClient({ payment }: ConfirmacionPagoClientProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Procesar el pago automáticamente cuando se carga la página
  useEffect(() => {
    const processPayment = async () => {
      // Solo procesar si el pago está pendiente
      if (payment.status === 'PENDING') {
        setIsProcessing(true);
        try {
          const response = await fetch('/api/payments/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentId: payment.id }),
          });

          if (response.ok) {
            console.log('✅ Pago procesado exitosamente');
            // Recargar la página para mostrar el estado actualizado
            window.location.reload();
          } else {
            console.error('❌ Error al procesar el pago');
          }
        } catch (error) {
          console.error('❌ Error en el procesamiento del pago:', error);
        } finally {
          setIsProcessing(false);
        }
      }
    };

    processPayment();
  }, [payment.id, payment.status]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = () => {
    const receiptData = {
      id: payment.id,
      orderNumber: payment.order?.orderNumber || 'N/A',
      amount: payment.amount,
      date: payment.createdAt,
      status: payment.status,
      items: payment.order?.items || [],
    };
    
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
      type: "application/json",
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comprobante-${payment.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FitZone - Confirmación de Pago",
          text: `He realizado una compra en FitZone por ${formatPrice(payment.amount)}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }
  };

  return (
    <div className="flex-1 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {isProcessing ? (
            <>
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Procesando Pago...
              </h1>
              <p className="text-gray-400 text-lg">
                Estamos confirmando tu pago, un momento por favor...
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                ¡Pago Confirmado!
              </h1>
              <p className="text-gray-400 text-lg">
                Tu pedido ha sido procesado exitosamente
              </p>
            </>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del Pedido */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Detalles del Pedido */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Detalles del Pedido</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Número de Orden</span>
                  <span className="text-white font-medium">
                    {payment.order?.orderNumber || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Estado del Pedido</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-medium">
                    {payment.order?.status === "CONFIRMED" ? "Confirmado" : payment.order?.status || "N/A"}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Estado del Pago</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-medium">
                    {payment.order?.paymentStatus === "PAID" ? "Pagado" : payment.order?.paymentStatus || "N/A"}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Método de Pago</span>
                  <span className="text-white font-medium">
                    {payment.paymentMethod === "CARD" ? "Tarjeta de Crédito" : 
                     payment.paymentMethod === "NEQUI" ? "Nequi" : 
                     payment.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Productos */}
              <div className="border-t border-white/[0.05] pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Productos Comprados</h3>
                
                <div className="space-y-3">
                  {(payment.order?.items || []).map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#040AE0]/10 to-[#D604E0]/10 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product?.imagen ? (
                          <img
                            src={item.product.imagen}
                            alt={item.product.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-[#040AE0]/30" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-white font-medium">
                          {item.product?.nombre || "Producto"}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Cantidad: {item.quantity} × {formatPrice(item.unitPrice || 0)}
                        </p>
                      </div>
                      
                      <span className="text-white font-bold">
                        {formatPrice(item.totalPrice || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/[0.05] mt-6 pt-6">
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total Pagado</span>
                  <span className="gradient-text">{formatPrice(payment.amount)}</span>
                </div>
              </div>
            </div>

            {/* Información de Pago */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Información de Pago</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">ID de Transacción</span>
                  <span className="text-white font-mono">{payment.transactionId}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Fecha</span>
                  <span className="text-white">{formatDate(payment.createdAt)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Dirección de Envío</span>
                  <span className="text-white text-sm text-right">
                    {payment.shippingAddress ? (
                      <>
                        {payment.shippingAddress.name}<br/>
                        {payment.shippingAddress.address}<br/>
                        {payment.shippingAddress.city}<br/>
                        {payment.shippingAddress.phone}
                      </>
                    ) : (
                      "No especificada"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Acciones */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Acciones Rápidas */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Acciones Rápidas</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.10] rounded-2xl font-medium text-white transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Descargar Comprobante
                </button>
                
                <button
                  onClick={handleShare}
                  className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.10] rounded-2xl font-medium text-white transition-all flex items-center justify-center gap-2"
                >
                  <Share className="w-5 h-5" />
                  Compartir
                </button>
                
                <Link
                  href="/perfil"
                  className="w-full py-3 gradient-bg rounded-2xl font-medium text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Ver Mis Pedidos
                </Link>
                
                <Link
                  href="/marketplace"
                  className="flex items-center gap-3 p-3 bg-white/[0.05] hover:bg-white/10 rounded-2xl transition-colors"
                >
                  <ShoppingBag className="w-5 h-5 text-white/60" />
                  <div className="flex-1">
                    <p className="text-white font-medium">Seguir Comprando</p>
                    <p className="text-gray-400 text-xs">Visita nuestro marketplace</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm text-center">
                📧 Recibirás un correo con los detalles de tu pedido
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
