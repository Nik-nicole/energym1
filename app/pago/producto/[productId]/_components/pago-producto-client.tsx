"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Check, ExternalLink, Package, MapPin, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string | null;
  categoria: string;
  stock: number;
  sede: {
    id: string;
    nombre: string;
  } | null;
}

interface PagoProductoClientProps {
  product: Producto;
}

export function PagoProductoClient({ product }: PagoProductoClientProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [quantity, setQuantity] = useState(1);
  const popupRef = useRef<Window | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Detectar cuando el usuario regresa del popup de pago
  useEffect(() => {
    if (paymentStatus !== 'processing' || !popupRef.current) return;

    const interval = setInterval(() => {
      if (popupRef.current?.closed) {
        clearInterval(interval);
        setPaymentStatus('completed');
        setLoading(false);
        // Redirigir a la página de perfil después de 2 segundos
        setTimeout(() => {
          router.push('/perfil');
        }, 2000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentStatus, router]);

  const handleProceedToPayment = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      // Llamar al endpoint de Bold para generar el pago del producto
      const response = await fetch("/api/payments/bold/create-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al preparar el pago");
      }

      const { paymentUrl, productOrderId } = data;

      // Guardar el productOrderId en sessionStorage para el callback
      sessionStorage.setItem("currentProductOrderId", productOrderId);

      console.log("[Bold Product] Payment URL recibida:", paymentUrl);

      setPaymentStatus('processing');

      // Abrir pasarela de pago de Bold en nueva pestaña
      const newWindow = window.open(paymentUrl, '_blank');
      popupRef.current = newWindow;

      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup bloqueado - mostrar mensaje al usuario
        alert('Por favor permite las ventanas emergentes para continuar con el pago, o haz clic derecho en el botón y selecciona "Abrir enlace en nueva pestaña"');
        setLoading(false);
        setPaymentStatus('idle');
        return;
      }

    } catch (error) {
      console.error("[Bold Product] Error al procesar el pago:", error);
      alert(error instanceof Error ? error.message : "Error al procesar el pago");
      setLoading(false);
    }
  };

  const subtotal = product.precio * quantity;
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  const images = product.imagen ? product.imagen.split(',').filter(img => img.trim()) : [];

  return (
    <div className="flex-1 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-light text-white mb-1">Completar Pago</h1>
              <p className="text-gray-400 text-sm">Finaliza tu compra de producto</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del Producto */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Información del Producto</h2>

              <div className="flex gap-6 mb-6">
                {/* Imagen del producto */}
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-[#040AE0]/5 to-[#D604E0]/5 flex-shrink-0">
                  {images[0] ? (
                    <img
                      src={images[0]}
                      alt={product.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-[#040AE0]/20" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{product.nombre}</h3>
                  <p className="text-gray-400 text-sm mb-3">{product.descripcion}</p>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{product.sede?.nombre || "Sede no disponible"}</span>
                  </div>
                </div>
              </div>

              {/* Selector de cantidad */}
              <div className="bg-white/[0.03] rounded-2xl p-4 mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-3">Cantidad</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={loading || paymentStatus === 'completed'}
                    className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-white text-xl font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={loading || paymentStatus === 'completed' || quantity >= product.stock}
                    className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-gray-400 text-sm ml-4">
                    {product.stock} unidades disponibles
                  </span>
                </div>
              </div>

              {/* Botón de Pago con Bold */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Pago seguro con Bold</h3>
                      <p className="text-gray-400 text-sm">Serás redirigido a la pasarela de pago</p>
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToPayment}
                    disabled={loading || paymentStatus === 'completed'}
                    className="w-full py-4 gradient-bg rounded-2xl font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {paymentStatus === 'completed' ? (
                      <>
                        <Check className="w-5 h-5" />
                        Pago completado - Redirigiendo...
                      </>
                    ) : loading ? (
                      "Preparando pago..."
                    ) : (
                      <>
                        <ExternalLink className="w-5 h-5" />
                        Pagar {formatPrice(total)}
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center text-gray-400 text-sm">
                  <p>Al continuar, serás redirigido a Bold para completar tu pago de forma segura.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Resumen */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Resumen del Pedido</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Producto</span>
                  <span className="text-white">{product.nombre}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Cantidad</span>
                  <span className="text-white">{quantity}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Precio unitario</span>
                  <span className="text-white">{formatPrice(product.precio)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">IVA (19%)</span>
                  <span className="text-white">{formatPrice(iva)}</span>
                </div>

                <div className="border-t border-white/[0.05] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Total</span>
                    <span className="text-2xl font-bold text-white">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Seguridad</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-gray-300 text-sm">Pago seguro con encriptación SSL</span>
                </div>

                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-300 text-sm">Protección al comprador</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
