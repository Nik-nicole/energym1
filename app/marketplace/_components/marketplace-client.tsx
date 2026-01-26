"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ShoppingBag, MapPin, Star, Package, Plus, Minus } from "lucide-react";
import { useCart } from "@/contexts/cart-context";

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

interface Sede {
  id: string;
  nombre: string;
}

interface MarketplaceClientProps {
  productos: Producto[];
  sedes: Sede[];
}

export function MarketplaceClient({ productos, sedes }: MarketplaceClientProps) {
  const { addItem, items } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSede, setSelectedSede] = useState<string>("all");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("destacado");

  // Obtener categorías únicas
  const categorias = useMemo(() => {
    const cats = new Set(productos.map(p => p.categoria));
    return Array.from(cats);
  }, [productos]);

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    let filtered = productos;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por sede
    if (selectedSede !== "all") {
      filtered = filtered.filter(p => p.sede.id === selectedSede);
    }

    // Filtrar por categoría
    if (selectedCategoria !== "all") {
      filtered = filtered.filter(p => p.categoria === selectedCategoria);
    }

    // Ordenar
    switch (sortBy) {
      case "precio-asc":
        filtered.sort((a, b) => a.precio - b.precio);
        break;
      case "precio-desc":
        filtered.sort((a, b) => b.precio - a.precio);
        break;
      case "nombre":
        filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case "destacado":
      default:
        filtered.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
        break;
    }

    return filtered;
  }, [productos, searchTerm, selectedSede, selectedCategoria, sortBy]);

  const handleAddToCart = (producto: Producto) => {
    addItem(producto);
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

  return (
    <div className="flex-1 pt-24 pb-16">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">
            Marketplace <span className="gradient-text">FitZone</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Descubre nuestros productos premium: suplementos, accesorios y equipos 
            de las mejores marcas disponibles en todas nuestras sedes.
          </p>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#141414] rounded-2xl p-6 border border-white/10 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#040AE0]"
              />
            </div>

            {/* Filtro por sede */}
            <select
              value={selectedSede}
              onChange={(e) => setSelectedSede(e.target.value)}
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#040AE0]"
            >
              <option value="all">Todas las sedes</option>
              {sedes.map(sede => (
                <option key={sede.id} value={sede.id}>{sede.nombre}</option>
              ))}
            </select>

            {/* Filtro por categoría */}
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#040AE0]"
            >
              <option value="all">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>

            {/* Ordenar */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#040AE0]"
            >
              <option value="destacado">Destacados</option>
              <option value="precio-asc">Precio: Menor a Mayor</option>
              <option value="precio-desc">Precio: Mayor a Menor</option>
              <option value="nombre">Nombre A-Z</option>
            </select>
          </div>
        </motion.div>

        {/* Resultados */}
        <div className="mb-6">
          <p className="text-gray-400">
            Mostrando <span className="text-white font-medium">{productosFiltrados.length}</span> productos
          </p>
        </div>

        {/* Grid de productos */}
        {productosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosFiltrados.map((producto, index) => (
              <motion.div
                key={producto.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#141414] rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                {/* Badge de destacado */}
                {producto.destacado && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1 bg-[#D604E0] rounded-full text-white text-xs font-medium">
                      Destacado
                    </span>
                  </div>
                )}

                {/* Imagen del producto */}
                <div className="aspect-square bg-gradient-to-br from-[#040AE0]/10 to-[#D604E0]/10 rounded-t-2xl overflow-hidden">
                  {producto.imagen ? (
                    <img 
                      src={producto.imagen} 
                      alt={producto.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-[#040AE0]/30" />
                    </div>
                  )}
                </div>

                {/* Información */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#040AE0] font-medium">
                      {producto.categoria}
                    </span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{producto.sede.nombre}</span>
                    </div>
                  </div>

                  <h3 className="text-white font-bold mb-2 line-clamp-2">
                    {producto.nombre}
                  </h3>

                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                    {producto.descripcion}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold gradient-text">
                      {formatPrice(producto.precio)}
                    </span>
                    {producto.stock > 0 ? (
                      <span className="text-xs text-green-500 font-medium">
                        Stock: {producto.stock}
                      </span>
                    ) : (
                      <span className="text-xs text-red-500 font-medium">
                        Agotado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const itemQuantity = getItemQuantity(producto.id);
                      return itemQuantity > 0 ? (
                        <>
                          <button
                            onClick={() => handleAddToCart(producto)}
                            className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar ({itemQuantity})
                          </button>
                          <div className="px-3 py-3 bg-[#040AE0] rounded-lg">
                            <span className="text-white font-medium">{itemQuantity}</span>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(producto)}
                          disabled={producto.stock === 0}
                          className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                            producto.stock > 0
                              ? "gradient-bg hover:opacity-90 text-white"
                              : "bg-gray-700 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          {producto.stock > 0 ? "Agregar al Carrito" : "Agotado"}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No se encontraron productos</h3>
            <p className="text-gray-400">
              Intenta ajustar los filtros o términos de búsqueda
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
