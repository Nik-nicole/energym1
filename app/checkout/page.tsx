"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/cart-context";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { ShoppingBag, CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  // Estado para el formulario de envío
  const [shippingData, setShippingData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    notes: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/checkout");
      return;
    }

    if (status === "loading") {
      return;
    }

    if (items.length === 0 && !loading && status === "authenticated") {
      router.push("/marketplace");
      return;
    }
  }, [status, session, items.length, router, loading]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = async () => {
    if (!session) return;

    // Validar formulario de envío
    if (!shippingData.name || !shippingData.phone || !shippingData.address || !shippingData.city) {
      alert("Por favor completa todos los campos de envío");
      return;
    }

    setLoading(true);

    try {
      // Crear orden y obtener link de pago de Bold
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.precio
          })),
          totalAmount: total,
          paymentMethod: "BOLD",
          shippingData: {
            name: shippingData.name,
            phone: shippingData.phone,
            address: shippingData.address,
            city: shippingData.city,
            notes: shippingData.notes
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error creating order");
      }

      const data = await response.json();
      const { paymentUrl, productOrderId } = data;

      // Guardar el productOrderId en sessionStorage
      sessionStorage.setItem("currentProductOrderId", productOrderId);

      // Limpiar carrito
      clearCart();

      // Redirigir al link de pago de Bold
      if (paymentUrl) {
        window.open(paymentUrl, '_blank');
      } else {
        throw new Error("No se recibió link de pago");
      }

    } catch (error) {
      console.error("Checkout error:", error);
      alert("Error al procesar el pedido. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505]">
      <Header />
      <div className="flex-1 pt-24 pb-16">
        <div className="max-w-[800px] mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al marketplace
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Finalizar Compra</h1>
            <p className="text-gray-400">Revisa tu pedido y procede al pago</p>
          </div>

          {/* Resumen del pedido */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#141414] rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <ShoppingBag className="w-6 h-6 text-[#040AE0]" />
              <h2 className="text-xl font-bold text-white">Resumen del Pedido</h2>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#040AE0]/10 to-[#D604E0]/10 rounded-lg overflow-hidden flex-shrink-0">
                    {item.imagen ? (
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-[#040AE0]/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium">{item.nombre}</h4>
                    <p className="text-gray-400 text-sm">
                      {item.quantity} x {formatPrice(item.precio)}
                    </p>
                  </div>
                  <span className="text-white font-medium">
                    {formatPrice(item.precio * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="border-t border-white/10 pt-4 space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Envío</span>
                <span>Gratis</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
                <span>Total</span>
                <span className="gradient-text">{formatPrice(total)}</span>
              </div>
            </div>
          </motion.div>

          {/* Formulario de envío */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#141414] rounded-2xl p-6 border border-white/10"
          >
            <h2 className="text-xl font-bold text-white mb-6">Datos de Envío</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={shippingData.name}
                    onChange={(e) => setShippingData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#040AE0] focus:outline-none transition-colors"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={shippingData.phone}
                    onChange={(e) => setShippingData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#040AE0] focus:outline-none transition-colors"
                    placeholder="Ej: 3001234567"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={shippingData.address}
                  onChange={(e) => setShippingData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#040AE0] focus:outline-none transition-colors"
                  placeholder="Ej: Calle 123 #45-67, Apt 301"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    value={shippingData.city}
                    onChange={(e) => setShippingData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#040AE0] focus:outline-none transition-colors"
                    placeholder="Ej: Bogotá"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notas adicionales
                  </label>
                  <input
                    type="text"
                    value={shippingData.notes}
                    onChange={(e) => setShippingData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#040AE0] focus:outline-none transition-colors"
                    placeholder="Ej: Punto de referencia, horario de entrega, etc."
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Botón de pago */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#141414] rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-[#040AE0]" />
              <h2 className="text-xl font-bold text-white">Método de Pago</h2>
            </div>

            {/* Botón de pago */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-4 gradient-bg rounded-lg font-medium text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              {loading ? "Procesando..." : "Pagar con Bold"}
            </button>

            {/* Información */}
            <div className="mt-4 p-4 bg-[#040AE0]/10 border border-[#040AE0]/20 rounded-lg">
              <p className="text-gray-300 text-sm text-center">
                Serás redirigido a Bold para completar el pago de forma segura.
                <br />
                <span className="text-[#040AE0]">Tu pedido será procesado con los datos de envío proporcionados.</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

