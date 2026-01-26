"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, MapPin, Package, Plus, Minus, ArrowLeft, Star, Truck, Shield, RefreshCw, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string;
  categoria: string;
  stock: number;
  destacado: boolean;
  sede: {
    id: string;
    nombre: string;
  };
}

interface ProductDetailClientProps {
  product: Producto;
  relatedProducts: Producto[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
  };

  const getItemQuantity = (productId: string) => {
    const item = items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const images = product.imagen ? product.imagen.split(',').filter(img => img.trim()) : [];

  return (
    <div className="flex-1 pt-24 pb-16">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/marketplace" className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la tienda
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Galería de imágenes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="space-y-4">
              {/* Imagen principal */}
              <div className="aspect-square bg-gradient-to-br from-[#040AE0]/5 to-[#D604E0]/5 rounded-2xl overflow-hidden relative">
                {images[selectedImage] ? (
                  <img
                    src={images[selectedImage]}
                    alt={`${product.nombre} - Vista ${selectedImage + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-[#040AE0]/20" />
                  </div>
                )}
                
                {/* Indicador de imagen actual */}
                {images.length > 1 && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-[#141414]/80 backdrop-blur-sm rounded-full">
                    <span className="text-white text-sm font-medium">
                      {selectedImage + 1} / {images.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Miniaturas */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? "border-[#040AE0] scale-105"
                          : "border-transparent hover:border-white/20"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.nombre} - Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Navegación con flechas */}
              {images.length > 1 && (
                <div className="flex justify-between">
                  <button
                    onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)}
                    className="w-10 h-10 bg-[#141414] border border-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-all"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((selectedImage + 1) % images.length)}
                    className="w-10 h-10 bg-[#141414] border border-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Información del producto */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-[#141414] border border-white/10 text-gray-300">
                  {product.categoria}
                </Badge>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">{product.sede.nombre}</span>
                </div>
                {product.destacado && (
                  <Badge className="bg-[#040AE0] text-white border-none">
                    Destacado
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold text-white mb-4">
                {product.nombre}
              </h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="text-3xl font-bold gradient-text">
                  {formatPrice(product.precio)}
                </div>
                {product.stock > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-[#141414] border border-white/10 rounded-full">
                      <span className="text-white text-sm font-medium">
                        {product.stock} unidades
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">disponibles</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-red-900/20 border border-red-800/50 rounded-full">
                      <span className="text-red-400 text-sm font-medium">
                        Agotado
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Descripción</h3>
              <p className="text-gray-300 leading-relaxed">
                {product.descripcion}
              </p>
            </div>

            {/* Beneficios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#040AE0]/10 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-[#040AE0]" />
                </div>
                <div>
                  <p className="text-white font-medium">Envío rápido</p>
                  <p className="text-gray-400 text-sm">2-3 días hábiles</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D604E0]/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#D604E0]" />
                </div>
                <div>
                  <p className="text-white font-medium">Garantía</p>
                  <p className="text-gray-400 text-sm">30 días</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#040AE0]/10 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-[#040AE0]" />
                </div>
                <div>
                  <p className="text-white font-medium">Devoluciones</p>
                  <p className="text-gray-400 text-sm">Fáciles y rápidas</p>
                </div>
              </div>
            </div>

            {/* Selector de cantidad y botón de compra */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Cantidad</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-[#141414] border border-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                    className="w-20 px-3 py-2 bg-[#141414] border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-[#040AE0]"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 bg-[#141414] border border-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`flex-1 py-4 rounded-xl font-medium transition-all ${
                    product.stock > 0
                      ? "bg-[#D604E0] hover:bg-[#D604E0]/80 text-white"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  {product.stock > 0 ? "Agregar al Carrito" : "Agotado"}
                </Button>
              </div>
            </div>

            {/* Información adicional */}
            <div className="border-t border-white/10 pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">SKU</p>
                  <p className="text-white font-medium">{product.id}</p>
                </div>
                <div>
                  <p className="text-gray-400">Categoría</p>
                  <p className="text-white font-medium">{product.categoria}</p>
                </div>
                <div>
                  <p className="text-gray-400">Sede</p>
                  <p className="text-white font-medium">{product.sede.nombre}</p>
                </div>
                <div>
                  <p className="text-gray-400">Estado</p>
                  <p className="text-white font-medium">
                    {product.stock > 0 ? "Disponible" : "No disponible"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Productos relacionados */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-white mb-8">Productos Relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link href={`/marketplace/product/${relatedProduct.id}`}>
                    <div className="bg-[#0A0A0A] rounded-xl overflow-hidden border border-transparent hover:border-[#040AE0]/30 transition-all duration-300 group">
                      <div className="aspect-square bg-gradient-to-br from-[#040AE0]/5 to-[#D604E0]/5 overflow-hidden">
                        {relatedProduct.imagen ? (
                          <img
                            src={relatedProduct.imagen}
                            alt={relatedProduct.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-[#040AE0]/20" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-medium mb-2 line-clamp-1 group-hover:text-[#040AE0] transition-colors">
                          {relatedProduct.nombre}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-white">
                            {formatPrice(relatedProduct.precio)}
                          </span>
                          {relatedProduct.stock > 0 ? (
                            <span className="text-xs text-green-500">
                              {relatedProduct.stock} disponibles
                            </span>
                          ) : (
                            <span className="text-xs text-red-500">
                              Agotado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
