"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ShoppingBag, MapPin, Star, Package, Plus, Minus, X, ChevronRight, ArrowLeft } from "lucide-react";
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

interface Sede {
  id: string;
  nombre: string;
}

interface MarketplaceClientProps {
  productos: Producto[];
  sedes: Sede[];
}

export function MarketplaceSidebarFixed({ productos, sedes }: MarketplaceClientProps) {
  const { addItem, items } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSede, setSelectedSede] = useState<string>("all");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [sortBy, setSortBy] = useState<string>("destacado");

  // Obtener categorías únicas
  const categorias = useMemo(() => {
    const cats = new Set(productos.map(p => p.categoria));
    return Array.from(cats);
  }, [productos]);

  // Obtener rango de precios
  const priceRangeLimits = useMemo(() => {
    const prices = productos.map(p => p.precio);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
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
  }, [productos, searchTerm, selectedSede, selectedCategoria, priceRange, sortBy]);

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
    setSelectedSede("all");
    setSelectedCategoria("all");
    setPriceRange([priceRangeLimits.min, priceRangeLimits.max]);
    setSortBy("destacado");
  };

  const hasActiveFilters = searchTerm || selectedSede !== "all" || selectedCategoria !== "all" || 
    priceRange[0] !== priceRangeLimits.min || priceRange[1] !== priceRangeLimits.max;

  return (
    <div className="flex-1 pt-24 pb-16">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header con flecha de regreso */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la página principal
          </Link>
          <h1 className="text-4xl font-bold mb-4">
            Tienda <span className="gradient-text">Energym</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Descubre nuestros productos premium: suplementos, accesorios y equipos 
            de las mejores marcas disponibles en todas nuestras sedes.
          </p>
        </motion.div>

        {/* Layout principal con sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de filtros */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-[#141414] rounded-2xl p-6 border border-white/10 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Filtros</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Búsqueda */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#040AE0]"
                    />
                  </div>
                </div>

                {/* Categorías */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">Categorías</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategoria("all")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedCategoria === "all"
                          ? "bg-[#040AE0] text-white"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Todas
                    </button>
                    {categorias.map(categoria => (
                      <button
                        key={categoria}
                        onClick={() => setSelectedCategoria(categoria)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                          selectedCategoria === categoria
                            ? "bg-[#040AE0] text-white"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {categoria}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sede */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Sede</label>
                  <select
                    value={selectedSede}
                    onChange={(e) => setSelectedSede(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#040AE0]"
                  >
                    <option value="all">Todas las sedes</option>
                    {sedes.map(sede => (
                      <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Rango de precio */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Rango de precio</label>
                  <div className="space-y-3">
                    <div className="text-xs text-gray-500 text-center">
                      {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={priceRangeLimits.min}
                        max={priceRangeLimits.max}
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                        className="w-full accent-[#040AE0]"
                      />
                      <input
                        type="range"
                        min={priceRangeLimits.min}
                        max={priceRangeLimits.max}
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full accent-[#D604E0]"
                      />
                    </div>
                  </div>
                </div>

                {/* Ordenar */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Ordenar por</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#040AE0]"
                  >
                    <option value="destacado">Destacados</option>
                    <option value="precio-asc">Precio: Menor a Mayor</option>
                    <option value="precio-desc">Precio: Mayor a Menor</option>
                    <option value="nombre">Nombre A-Z</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contenido principal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            {/* Resultados */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-400">
                Mostrando <span className="text-white font-medium">{productosFiltrados.length}</span> productos
              </p>
              {hasActiveFilters && (
                <p className="text-sm text-gray-500">
                  Filtros activos
                </p>
              )}
            </div>

            {/* Grid de productos */}
            {productosFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {productosFiltrados.map((producto, index) => (
                  <motion.div
                    key={producto.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link href={`/marketplace/product/${producto.id}`}>
                      <div className="relative bg-[#1A1A1A] rounded-xl overflow-hidden border border-white/10 hover:border-[#040AE0]/30 transition-all duration-300 group">
                        {/* Badge de AGOTADO */}
                        {producto.stock === 0 && (
                          <div className="absolute top-3 left-3 z-10">
                            <span className="px-2 py-1 bg-red-600 rounded-full text-white text-xs font-bold">
                              AGOTADO
                            </span>
                          </div>
                        )}

                        {/* Imagen del producto */}
                        <div className="aspect-square bg-gradient-to-br from-[#040AE0]/10 to-[#D604E0]/10 rounded-t-xl overflow-hidden relative">
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
                            <div className="absolute top-2 right-2 px-2 py-1 bg-[#141414]/80 backdrop-blur-sm rounded-full">
                              <span className="text-white text-xs font-medium">
                                +{producto.imagen.split(',').length - 1} fotos
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Contenido de la card */}
                        <div className="p-4">
                          {/* Badge de categoría */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2 py-1 bg-[#040AE0]/20 rounded-full text-[#040AE0] text-xs font-medium">
                              {producto.categoria}
                            </span>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">{producto.sede.nombre}</span>
                            </div>
                          </div>

                          {/* Nombre y descripción */}
                          <div className="mb-3">
                            <h3 className="text-white font-bold text-base mb-1 line-clamp-1 group-hover:text-[#040AE0] transition-colors">
                              {producto.nombre}
                            </h3>
                            <p className="text-gray-400 text-xs line-clamp-2 mb-2">
                              {producto.descripcion}
                            </p>
                          </div>

                          {/* Precio */}
                          <div className="flex items-end justify-between mb-3">
                            <div>
                              <span className="text-xl font-bold text-white">
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

                          {/* Botones de acción */}
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleAddToCart(producto, e)}
                              disabled={producto.stock === 0}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                producto.stock > 0
                                  ? "bg-[#D604E0] hover:bg-[#D604E0]/80 text-white"
                                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              <ShoppingBag className="w-4 h-4 inline mr-2" />
                              {producto.stock > 0 ? "Agregar" : "Agotado"}
                            </button>
                            
                            <button
                              className="px-3 py-2 bg-[#141414] border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
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
                <p className="text-gray-400 mb-4">
                  Intenta ajustar los filtros o términos de búsqueda
                </p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} className="gradient-bg">
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
