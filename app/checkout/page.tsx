"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/cart-context";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { ShoppingBag, User, MapPin, CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    notes: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/checkout");
      return;
    }

    if (items.length === 0) {
      router.push("/marketplace");
      return;
    }

    // Prellenar datos del usuario
    if (session?.user) {
      setShippingAddress(prev => ({
        ...prev,
        name: `${(session.user as any)?.name || ""} ${(session.user as any)?.lastName || ""}`.trim()
      }));
    }
  }, [status, session, items.length, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = async () => {
    if (!session) return;

    setLoading(true);

    try {
      // Crear orden
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
          shippingAddress,
          paymentMethod: "WOMPI"
        }),
      });

      if (!response.ok) {
        throw new Error("Error creating order");
      }

      const { order } = await response.json();

      // Limpiar carrito
      clearCart();

      // Redirigir a página de pago (integración con Wompi)
      router.push(`/payment/${order.id}`);
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
        <div className="max-w-[1200px] mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Marketplace
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Checkout</h1>
            <p className="text-gray-400">Revisa tu pedido y completa tus datos</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario */}
            <div className="lg:col-span-2 space-y-6">
              {/* Datos del usuario */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414] rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-6 h-6 text-[#040AE0]" />
                  <h2 className="text-xl font-bold text-white">Datos Personales</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#040AE0]"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#040AE0]"
                      placeholder="+57 300 000 0000"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Dirección de envío */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#141414] rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-[#040AE0]" />
                  <h2 className="text-xl font-bold text-white">Dirección de Envío</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#040AE0]"
                      placeholder="Calle 123 #45-67"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#040AE0]"
                      placeholder="Bogotá"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={shippingAddress.notes}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#040AE0]"
                      placeholder="Instrucciones especiales de entrega..."
                      rows={3}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Resumen del pedido */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="bg-[#141414] rounded-2xl p-6 border border-white/10 sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingBag className="w-6 h-6 text-[#040AE0]" />
                  <h2 className="text-xl font-bold text-white">Resumen del Pedido</h2>
                </div>

                {/* Items */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#040AE0]/10 to-[#D604E0]/10 rounded-lg overflow-hidden flex-shrink-0">
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
                        <h4 className="text-white font-medium truncate">{item.nombre}</h4>
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

                {/* Botón de pago */}
                <button
                  onClick={handleCheckout}
                  disabled={loading || !shippingAddress.name || !shippingAddress.address}
                  className="w-full mt-6 py-4 gradient-bg rounded-lg font-medium text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  {loading ? "Procesando..." : "Proceder al Pago"}
                </button>

                {/* Información de seguridad */}
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-xs text-center">
                    🔒 Pago seguro con Wompi. Tu información está protegida.
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
