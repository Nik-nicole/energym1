"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { CreditCard, Smartphone, ArrowLeft, Shield, Check } from "lucide-react";
import Link from "next/link";

interface OrderDetails {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product?: {
      id: string;
      nombre: string;
      imagen?: string;
    };
  }>;
}

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "nequi">("card");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });
  const [nequiPhone, setNequiPhone] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (id) {
      fetchOrderDetails();
    }
  }, [status, id, router]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${id}`);
      console.log("Fetching order from:", `/api/orders/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Order data received:", data);
        setOrderDetails(data.order);
      } else {
        const errorData = await response.json();
        console.error("Order fetch error:", errorData);
        if (response.status === 404) {
          // Si no se encuentra la orden, redirigir al marketplace
          router.push("/marketplace");
        }
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      // En caso de error, redirigir al marketplace después de un tiempo
      setTimeout(() => {
        router.push("/marketplace");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handlePayment = async () => {
    if (!orderDetails) return;

    setProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch("/api/payments/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderDetails.id,
          amount: orderDetails.totalAmount,
          paymentMethod,
        }),
      });

      if (response.ok) {
        const { payment } = await response.json();
        router.push(`/pago/confirmacion/${payment.id}`);
      } else {
        throw new Error("Error processing payment");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Error al procesar el pago. Por favor intenta nuevamente.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white">Orden no encontrada</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505]">
      <Header />
      <div className="flex-1 pt-24 pb-16">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="mb-8">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Checkout
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Pago Seguro</h1>
            <p className="text-gray-400">Completa tu pago de forma segura</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414] rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-xl font-bold text-white mb-6">Método de Pago</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === "card"
                        ? "border-[#040AE0] bg-[#040AE0]/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-white">Tarjeta</span>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod("nequi")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === "nequi"
                        ? "border-[#040AE0] bg-[#040AE0]/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <Smartphone className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-white">Nequi</span>
                  </button>
                </div>

                {paymentMethod === "card" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Número de Tarjeta
                      </label>
                      <input
                        type="text"
                        value={cardData.cardNumber}
                        onChange={(e) => setCardData(prev => ({ ...prev, cardNumber: e.target.value }))}
                        className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#040AE0]"
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Nombre del Titular
                      </label>
                      <input
                        type="text"
                        value={cardData.cardName}
                        onChange={(e) => setCardData(prev => ({ ...prev, cardName: e.target.value }))}
                        className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#040AE0]"
                        placeholder="JUAN PEREZ"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Vencimiento
                        </label>
                        <input
                          type="text"
                          value={cardData.expiry}
                          onChange={(e) => setCardData(prev => ({ ...prev, expiry: e.target.value }))}
                          className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#040AE0]"
                          placeholder="MM/AA"
                          maxLength={5}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardData.cvv}
                          onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value }))}
                          className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#040AE0]"
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Número de Teléfono Nequi
                    </label>
                    <input
                      type="tel"
                      value={nequiPhone}
                      onChange={(e) => setNequiPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#040AE0]"
                      placeholder="300 000 0000"
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      Recibirás una notificación en tu teléfono para confirmar el pago.
                    </p>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#141414] rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-green-500" />
                  <h3 className="text-lg font-bold text-white">Pago Seguro</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">Encriptación SSL de 256 bits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">Cumplimiento PCI DSS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">Procesamiento seguro con Wompi</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="bg-[#141414] rounded-2xl p-6 border border-white/10 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6">Resumen del Pedido</h2>
                
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {orderDetails.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#040AE0]/10 to-[#D604E0]/10 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product?.imagen ? (
                          <img
                            src={item.product.imagen}
                            alt={item.product.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-[#040AE0]/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {item.product?.nombre || "Producto"}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {item.quantity} x {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <span className="text-white font-medium">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(orderDetails.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Envío</span>
                    <span>Gratis</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
                    <span>Total</span>
                    <span className="gradient-text">{formatPrice(orderDetails.totalAmount)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={processing || (paymentMethod === "card" && (!cardData.cardNumber || !cardData.cardName || !cardData.expiry || !cardData.cvv)) || (paymentMethod === "nequi" && !nequiPhone)}
                  className="w-full mt-6 py-4 gradient-bg rounded-lg font-medium text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pagar {formatPrice(orderDetails.totalAmount)}
                    </>
                  )}
                </button>

                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-xs text-center">
                    🔒 Esta es una simulación de pago. No se realizará ningún cargo real.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
