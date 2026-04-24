"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ShoppingBag, Star, Package, Plus, Minus, X, ChevronRight, ArrowLeft } from "lucide-react";
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
}

interface MarketplaceClientProps {
  productos: Producto[];
}

export function MarketplaceSidebarFixed({ productos }: MarketplaceClientProps) {
  const { addItem, items } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("destacado");

  // Obtener categorías únicas
  const categorias = useMemo(() => {
    const cats = new Set(productos.map(p => p.categoria));
    return Array.from(cats);
  }, [productos]);

  // Obtener rango de precios
  const priceRangeLimits = useMemo(() => {
    if (!productos || productos.length === 0) return { min: 0, max: 1000000 };
    const prices = productos.map(p => p.precio);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [productos]);

  const [priceRange, setPriceRange] = useState<[number, number]>([priceRangeLimits.min, priceRangeLimits.max]);

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

    // Filtrar por categoría
    if (selectedCategoria !== "all") {
      filtered = filtered.filter(p => p.categoria === selectedCategoria);
    }

    // Filtrar por rango de precio
    filtered = filtered.filter(p => p.precio >= priceRange[0] && p.precio <= priceRange[1]);

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
  }, [productos, searchTerm, selectedCategoria, priceRange, sortBy]);

  const handleAddToCart = (producto: Producto, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
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

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategoria("all");
    setPriceRange([priceRangeLimits.min, priceRangeLimits.max]);
    setSortBy("destacado");
  };

  const hasActiveFilters = searchTerm || selectedCategoria !== "all" || 
    priceRange[0] !== priceRangeLimits.min || priceRange[1] !== priceRangeLimits.max;

  const getActiveFilters = () => {
    const filters = [];
    if (selectedCategoria !== "all") filters.push({ type: "categoria", label: selectedCategoria, value: selectedCategoria });
    if (searchTerm) filters.push({ type: "search", label: `Búsqueda: ${searchTerm}`, value: searchTerm });
    if (priceRange[0] !== priceRangeLimits.min || priceRange[1] !== priceRangeLimits.max) {
      filters.push({ type: "price", label: `${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`, value: "price" });
    }
    return filters;
  };

  const removeFilter = (filter: any) => {
    if (filter.type === "categoria") setSelectedCategoria("all");
    if (filter.type === "search") setSearchTerm("");
    if (filter.type === "price") setPriceRange([priceRangeLimits.min, priceRangeLimits.max]);
  };

  return (
    <div className="flex-1 pt-24 pb-16">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Header con título y búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Link>
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Tienda Energym</span>
            </h1>
          </div>
          {/* Búsqueda en la derecha */}
          <div className="w-full md:w-96 lg:w-[500px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 text-base focus:outline-none focus:border-[#040AE0] focus:bg-white/15 transition-all shadow-lg shadow-black/10"
              />
            </div>
          </div>
        </motion.div>

        {/* Filtros activos */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap gap-2 items-center"
          >
            <span className="text-xs text-gray-400">Filtros activos:</span>
            {getActiveFilters().map((filter, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs text-white"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => removeFilter(filter)}
                  className="ml-1 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full text-red-300 hover:bg-red-500/30 transition-all"
            >
              Limpiar todo
            </button>
          </motion.div>
        )}

        {/* Barra de categorías */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 overflow-x-auto pb-3"
        >
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedCategoria("all")}
              className={`px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all shadow-sm ${
                selectedCategoria === "all"
                  ? "bg-gradient-to-r from-[#040AE0] to-[#040AE0]/80 text-white shadow-lg shadow-[#040AE0]/30"
                  : "bg-white/10 text-gray-300 hover:text-white border border-white/20 hover:bg-white/15"
              }`}
            >
              Todas
            </button>
            {categorias.map(categoria => (
              <button
                key={categoria}
                onClick={() => setSelectedCategoria(categoria)}
                className={`px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all shadow-sm ${
                  selectedCategoria === categoria
                    ? "bg-gradient-to-r from-[#D604E0] to-[#D604E0]/80 text-white shadow-lg shadow-[#D604E0]/30"
                    : "bg-white/10 text-gray-300 hover:text-white border border-white/20 hover:bg-white/15"
                }`}
              >
                {categoria}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Layout principal con sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar de filtros */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/15 sticky top-24 space-y-6 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-base font-bold text-white">Filtros</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Rango de precio */}
              <div>
                <label className="block text-sm font-semibold text-white mb-4">Rango de Precio</label>
                <div className="bg-gradient-to-r from-[#040AE0]/20 to-[#D604E0]/20 border border-white/10 rounded-xl p-3 mb-4">
                  <div className="text-center">
                    <div className="text-sm font-bold text-white">
                      {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Mínimo</span>
                    <input
                      type="range"
                      min={priceRangeLimits.min}
                      max={priceRangeLimits.max}
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full h-3 accent-[#040AE0] rounded-full appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #040AE0 0%, #040AE0 ${((priceRange[0] - priceRangeLimits.min) / (priceRangeLimits.max - priceRangeLimits.min)) * 100}%, rgba(255,255,255,0.1) ${((priceRange[0] - priceRangeLimits.min) / (priceRangeLimits.max - priceRangeLimits.min)) * 100}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Máximo</span>
                    <input
                      type="range"
                      min={priceRangeLimits.min}
                      max={priceRangeLimits.max}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-3 accent-[#D604E0] rounded-full appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) ${((priceRange[1] - priceRangeLimits.min) / (priceRangeLimits.max - priceRangeLimits.min)) * 100}%, #D604E0 ${((priceRange[1] - priceRangeLimits.min) / (priceRangeLimits.max - priceRangeLimits.min)) * 100}%, #D604E0 100%)`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Ordenar */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2.5">Ordenar</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#040AE0] focus:bg-white/15 transition-all"
                >
                  <option value="destacado">Destacados</option>
                  <option value="precio-asc">Menor Precio</option>
                  <option value="precio-desc">Mayor Precio</option>
                  <option value="nombre">Nombre A-Z</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Contenido principal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4"
          >
            {/* Contador */}
            <div className="mb-6">
              <p className="text-sm text-gray-400">
                Mostrando <span className="text-white font-semibold">{productosFiltrados.length}</span> productos
              </p>
            </div>

            {/* Grid de productos */}
            {productosFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {productosFiltrados.map((producto, index) => (
                  <motion.div
                    key={producto.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <div className="h-full relative bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 group hover:shadow-xl hover:shadow-[#040AE0]/15 flex flex-col">
                      {/* Badge de DESTACADO */}
                      {producto.destacado && (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="px-2 py-1 bg-[#D604E0] rounded-full text-white text-xs font-bold">
                            Destacado
                          </span>
                        </div>
                      )}

                      {/* Badge de AGOTADO */}
                      {producto.stock === 0 && (
                        <div className="absolute top-2 right-2 z-10">
                          <span className="px-2 py-1 bg-red-500/90 rounded-full text-white text-xs font-bold">
                            Agotado
                          </span>
                        </div>
                      )}

                      <Link href={`/marketplace/product/${producto.id}`} className="flex-1">
                        {/* Imagen del producto */}
                        <div className="aspect-square bg-gradient-to-br from-[#040AE0]/10 to-[#D604E0]/10 overflow-hidden relative">
                          {producto.imagen ? (
                            <img 
                              src={producto.imagen.split(',')[0]} 
                              alt={producto.nombre}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-12 h-12 text-[#040AE0]/20" />
                            </div>
                          )}
                        </div>

                        {/* Contenido de la card (sin botones) */}
                        <div className="p-4">
                          {/* Categoría */}
                          <span className="text-xs font-bold text-[#D604E0] mb-2.5 block">
                            {producto.categoria}
                          </span>

                          {/* Nombre */}
                          <h3 className="text-sm font-bold text-white mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#040AE0] group-hover:to-[#D604E0] transition-all">
                            {producto.nombre}
                          </h3>

                          {/* Descripción */}
                          <p className="text-xs text-gray-400 line-clamp-1 mb-3">
                            {producto.descripcion}
                          </p>

                          {/* Precio */}
                          <div className="mb-3">
                            <span className="text-lg font-bold text-white">
                              {formatPrice(producto.precio)}
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* Dos botones */}
                      <div className="flex gap-2 p-4 pt-0">
                        <button
                          onClick={(e) => handleAddToCart(producto, e)}
                          disabled={producto.stock === 0}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                            producto.stock > 0
                              ? "bg-gradient-to-r from-[#D604E0] to-[#D604E0]/80 hover:shadow-lg hover:shadow-[#D604E0]/40 text-white"
                              : "bg-gray-600/40 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 inline mr-1.5" />
                          Carrito
                        </button>
                        <Link href={`/marketplace/product/${producto.id}`} className="flex-1">
                          <button className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all bg-gradient-to-r from-[#D604E0]/70 to-[#D604E0]/60 hover:from-[#D604E0] hover:to-[#D604E0]/80 hover:shadow-lg hover:shadow-[#D604E0]/40 text-white border border-[#D604E0]/30">
                            Ver detalles
                          </button>
                        </Link>
                      </div>
                    </div>
                    </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No hay productos</h3>
                <p className="text-gray-500 mb-6 text-sm">
                  Ajusta los filtros o intenta con otro término de búsqueda
                </p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} className="gradient-bg text-white">
                    Limpiar filtros
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
