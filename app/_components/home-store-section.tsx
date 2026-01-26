"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Star, MapPin, Package, ChevronRight } from "lucide-react";
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

interface HomeStoreSectionProps {
  productos: Producto[];
}

export function HomeStoreSection({ productos }: HomeStoreSectionProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const productosDestacados = productos.filter(p => p.destacado).slice(0, 8);

  return (
    <section className="py-20 bg-[#050505]">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#040AE0]/10 rounded-full text-[#040AE0] text-sm font-medium mb-4">
            <ShoppingBag className="w-4 h-4" />
            Tienda
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Productos <span className="gradient-text">Premium</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Suplementos, accesorios y equipos de las mejores marcas. 
            Disponibles en todas nuestras sedes.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-8 py-4 gradient-bg rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
          >
            Ver Todos los Productos
            <ChevronRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {productosDestacados.map((producto, index) => (
            <motion.div
              key={producto.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <Link href={`/marketplace/product/${producto.id}`}>
                <div className="relative bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/10 hover:border-[#040AE0]/30 transition-all duration-300 group">
                  {/* Badge de AGOTADO */}
                  {producto.stock === 0 && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 bg-red-600 rounded-full text-white text-xs font-bold">
                        AGOTADO
                      </span>
                    </div>
                  )}

                  {/* Imagen del producto */}
                  <div className="aspect-square bg-gradient-to-br from-[#040AE0]/10 to-[#D604E0]/10 rounded-t-2xl overflow-hidden relative">
                    {producto.imagen ? (
                      <img 
                        src={producto.imagen.split(',')[0]} 
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-[#040AE0]/30" />
                      </div>
                    )}
                    
                    {/* Indicador de múltiples imágenes */}
                    {producto.imagen && producto.imagen.split(',').length > 1 && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-[#141414]/80 backdrop-blur-sm rounded-full">
                        <span className="text-white text-xs font-medium">
                          +{producto.imagen.split(',').length - 1} fotos
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contenido de la card */}
                  <div className="p-6">
                    {/* Badge de categoría */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-[#040AE0]/20 rounded-full text-[#040AE0] text-xs font-medium">
                        {producto.categoria}
                      </span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{producto.sede.nombre}</span>
                      </div>
                    </div>

                    {/* Nombre y descripción */}
                    <div className="mb-4">
                      <h3 className="text-white font-bold text-lg mb-2 line-clamp-1 group-hover:text-[#040AE0] transition-colors">
                        {producto.nombre}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {producto.descripcion}
                      </p>
                    </div>

                    {/* Precio */}
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-white">
                          {formatPrice(producto.precio)}
                        </span>
                      </div>
                      <div className="text-right">
                        {producto.stock > 0 ? (
                          <div className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                            <span className="text-green-400 text-xs font-medium">
                              Disponible
                            </span>
                          </div>
                        ) : (
                          <div className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-full">
                            <span className="text-red-400 text-xs font-medium">
                              Agotado
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botón de acción */}
                    <div className="flex gap-3">
                      <button className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        producto.stock > 0
                          ? "bg-[#D604E0] hover:bg-[#D604E0]/80 text-white"
                          : "bg-gray-700 text-gray-400 cursor-not-allowed"
                      }`}>
                        <ShoppingBag className="w-4 h-4" />
                        {producto.stock > 0 ? "Ver Detalles" : "Agotado"}
                      </button>
                      <button className="px-3 py-3 bg-[#141414] border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Botón para ver todos los productos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#040AE0] hover:bg-[#040AE0]/80 rounded-lg font-medium text-white transition-all"
          >
            Explorar Tienda Completa
            <ChevronRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
