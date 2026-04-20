"use client";

// External libraries
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, CreditCard, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

// Internal components and contexts
import { useCart } from "@/contexts/cart-context";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [isRedirectingToPaymentStatus, setIsRedirectingToPaymentStatus] = useState(false);

  // Estado para el formulario de envío
  const [shippingData, setShippingData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    notes: ""
  });

  // Estados de validación
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Funciones de validación
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^3[0-9]{9}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  const validateName = (name: string): boolean => {
    return name.trim().length >= 3 && name.trim().length <= 50 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)
  }

  const validateAddress = (address: string): boolean => {
    return address.trim().length >= 5 && address.trim().length <= 100
  }

  const validateCity = (city: string): boolean => {
    return city.trim().length >= 3 && city.trim().length <= 30 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(city)
  }

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'phone':
        if (!value.trim()) return 'El teléfono es obligatorio'
        if (!validatePhone(value)) return 'El teléfono debe tener 10 dígitos y empezar con 3'
        break
      case 'name':
        if (!value.trim()) return 'El nombre es obligatorio'
        if (!validateName(value)) return 'El nombre debe tener entre 3 y 50 caracteres, solo letras'
        break
      case 'address':
        if (!value.trim()) return 'La dirección es obligatoria'
        if (!validateAddress(value)) return 'La dirección debe tener entre 5 y 100 caracteres'
        break
      case 'city':
        if (!value.trim()) return 'La ciudad es obligatoria'
        if (!validateCity(value)) return 'La ciudad debe tener entre 3 y 30 caracteres, solo letras'
        break
    }
    return ''
  }

  const formatPhone = (value: string) => {
    // Solo permitir números y máximo 10 dígitos
    const cleaned = value.replace(/\D/g, '').slice(0, 10)
    return cleaned
  }

  const formatName = (value: string) => {
    // Solo permitir letras, espacios y caracteres españoles, máximo 50 caracteres
    const cleaned = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').slice(0, 50)
    return cleaned
  }

  const formatCity = (value: string) => {
    // Solo permitir letras, espacios y caracteres españoles, máximo 30 caracteres
    const cleaned = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').slice(0, 30)
    return cleaned
  }

  const formatAddress = (value: string) => {
    // Permitir caracteres alfanuméricos y símbolos comunes en direcciones, máximo 100 caracteres
    const cleaned = value.slice(0, 100)
    return cleaned
  }

  const handleInputChange = (field: string, value: string) => {
    setShippingData(prev => ({ ...prev, [field]: value }))
    
    // Validar en tiempo real
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error }))
    }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    const requiredFields = ['name', 'phone', 'address', 'city']

    requiredFields.forEach(field => {
      const error = validateField(field, shippingData[field as keyof typeof shippingData])
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(Object.fromEntries(requiredFields.map(field => [field, true])))
    
    return isValid
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/checkout");
      return;
    }

    if (status === "loading") {
      return;
    }

    if (items.length === 0 && !loading && status === "authenticated" && !isRedirectingToPaymentStatus) {
      router.push("/marketplace");
      return;
    }
  }, [status, session, items.length, router, loading, isRedirectingToPaymentStatus]);

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
    if (!validateForm()) {
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
      setIsRedirectingToPaymentStatus(true);
      clearCart();

      // Redirigir al link de pago de Bold
      if (paymentUrl) {
        window.open(paymentUrl, '_blank');
        if (productOrderId) {
          router.push(`/payment-status?orderId=${productOrderId}`);
        }
      } else {
        throw new Error("No se recibió link de pago");
      }

    } catch (error) {
      console.error("Checkout error:", error);
      setIsRedirectingToPaymentStatus(false);
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
              Volver al marketplace
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Finalizar Compra</h1>
            <p className="text-gray-400">Revisa tu pedido y procede al pago</p>
          </div>

          {/* Layout de dos columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna izquierda: Formulario de envío */}
            <div className="h-full flex flex-col">
              {/* Formulario de envío */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#141414] rounded-2xl p-6 border border-white/10 flex-1"
              >
                <h2 className="text-xl font-bold text-white mb-6">Datos de Envío</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        Nombre completo *
                        {touched.name && errors.name && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        {touched.name && !errors.name && shippingData.name && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </label>
                      <input
                        type="text"
                        value={shippingData.name}
                        onChange={(e) => handleInputChange('name', formatName(e.target.value))}
                        onBlur={() => handleBlur('name', shippingData.name)}
                        className={`w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          touched.name && errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 
                          touched.name && !errors.name && shippingData.name ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : 'border-white/10 focus:border-[#040AE0]'
                        }`}
                        placeholder="Ej: Juan Pérez"
                        maxLength={50}
                      />
                      {touched.name && errors.name && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.name}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        Teléfono *
                        {touched.phone && errors.phone && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        {touched.phone && !errors.phone && shippingData.phone && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </label>
                      <input
                        type="tel"
                        value={shippingData.phone}
                        onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                        onBlur={() => handleBlur('phone', shippingData.phone)}
                        className={`w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          touched.phone && errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 
                          touched.phone && !errors.phone && shippingData.phone ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : 'border-white/10 focus:border-[#040AE0]'
                        }`}
                        placeholder="Ej: 3001234567"
                        maxLength={10}
                      />
                      {touched.phone && errors.phone && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.phone}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs mt-1">Celular colombiano: 10 dígitos, empieza con 3</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      Dirección *
                      {touched.address && errors.address && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      {touched.address && !errors.address && shippingData.address && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </label>
                    <input
                      type="text"
                      value={shippingData.address}
                      onChange={(e) => handleInputChange('address', formatAddress(e.target.value))}
                      onBlur={() => handleBlur('address', shippingData.address)}
                      className={`w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          touched.address && errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 
                          touched.address && !errors.address && shippingData.address ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : 'border-white/10 focus:border-[#040AE0]'
                        }`}
                        placeholder="Ej: Calle 123 #45-67, Apt 301"
                        maxLength={100}
                    />
                    {touched.address && errors.address && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                          {errors.address}
                        </p>
                      )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        Ciudad *
                        {touched.city && errors.city && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        {touched.city && !errors.city && shippingData.city && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </label>
                      <input
                        type="text"
                        value={shippingData.city}
                        onChange={(e) => handleInputChange('city', formatCity(e.target.value))}
                        onBlur={() => handleBlur('city', shippingData.city)}
                        className={`w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          touched.city && errors.city ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 
                          touched.city && !errors.city && shippingData.city ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : 'border-white/10 focus:border-[#040AE0]'
                        }`}
                        placeholder="Ej: Bogotá"
                        maxLength={30}
                      />
                      {touched.city && errors.city && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.city}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2">
                      Notas adicionales
                    </label>
                    <textarea
                      value={shippingData.notes}
                      onChange={(e) => setShippingData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                      placeholder="Ej: Punto de referencia, horario de entrega, etc."
                      rows={4}
                      maxLength={200}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Columna derecha: Resumen del pedido */}
            <div className="space-y-6">
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
                  <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
                    <span>Total</span>
                    <span className="gradient-text">{formatPrice(total)}</span>
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
        </div>
      </div>
      <Footer />
    </main>
  );
}

