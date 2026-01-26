"use client";

import { useCart } from "@/contexts/cart-context";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Trash2, CreditCard } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export function CartSidebar() {
  try {
    const { 
      items, 
      total, 
      itemCount, 
      removeItem, 
      updateQuantity, 
      clearCart, 
      isOpen, 
      setIsOpen 
    } = useCart();
    
    const { data: session } = useSession();

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(price);
    };

    const handleCheckout = () => {
      if (!session) {
        // Redirigir a login si no está autenticado
        window.location.href = `/login?redirect=/cart`;
        return;
      }
      // Redirigir a checkout
      window.location.href = `/checkout`;
    };

    return (
      <>
        {/* Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#141414] border-l border-white/10 z-50 overflow-hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6 text-[#040AE0]" />
                    <h2 className="text-xl font-bold text-white">
                      Mi Carrito ({itemCount})
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-6">
                  {items.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">
                        Tu carrito está vacío
                      </h3>
                      <p className="text-gray-400 mb-6">
                        Agrega algunos productos para comenzar
                      </p>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="px-6 py-3 gradient-bg rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
                      >
                        Seguir Comprando
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-[#0A0A0A] rounded-lg p-4"
                        >
                          <div className="flex gap-4">
                            {/* Imagen */}
                            <div className="w-20 h-20 bg-gradient-to-br from-[#040AE0]/10 to-[#D604E0]/10 rounded-lg overflow-hidden flex-shrink-0">
                              {item.imagen ? (
                                <img
                                  src={item.imagen}
                                  alt={item.nombre}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="w-8 h-8 text-[#040AE0]/30" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium mb-1 truncate">
                                {item.nombre}
                              </h4>
                              <p className="text-xs text-gray-400 mb-2">
                                {item.categoria} • {item.sede.nombre}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold gradient-text">
                                  {formatPrice(item.precio)}
                                </span>
                                
                                {/* Controles de cantidad */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                                  >
                                    <Minus className="w-4 h-4 text-white" />
                                  </button>
                                  
                                  <span className="w-8 text-center text-white font-medium">
                                    {item.quantity}
                                  </span>
                                  
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    disabled={item.quantity >= item.stock}
                                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Plus className="w-4 h-4 text-white" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Eliminar */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                  <div className="border-t border-white/10 p-6 space-y-4">
                    {/* Total */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-2xl font-bold gradient-text">
                        {formatPrice(total)}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div className="space-y-3">
                      <button
                        onClick={handleCheckout}
                        className="w-full py-3 gradient-bg rounded-lg font-medium text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-5 h-5" />
                        Proceder al Pago
                      </button>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={clearCart}
                          className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg font-medium transition-colors"
                        >
                          Vaciar Carrito
                        </button>
                        
                        <button
                          onClick={() => setIsOpen(false)}
                          className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                        >
                          Seguir Comprando
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  } catch (error) {
    // Si el contexto no está disponible, no renderizar nada
    return null;
  }
}
