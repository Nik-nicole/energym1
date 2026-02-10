"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ShoppingBag, MapPin, Star, Package, Plus, Minus, X, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export function MarketplaceMinimal({ productos, sedes }: MarketplaceClientProps) {
  const { addItem, items } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSede, setSelectedSede] = useState<string>("all");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [sortBy, setSortBy] = useState<string>("destacado");
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

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

        {/* Filtros superiores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {/* Categorías */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategoria("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategoria === "all"
                    ? "gradient-bg text-white"
                    : "bg-[#141414] text-gray-400 hover:text-white border border-white/10"
                }`}
              >
                Todas
              </button>
              {categorias.map(categoria => (
                <button
                  key={categoria}
                  onClick={() => setSelectedCategoria(categoria)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategoria === categoria
                      ? "gradient-bg text-white"
                      : "bg-[#141414] text-gray-400 hover:text-white border border-white/10"
                  }`}
                >
                  {categoria}
                </button>
              ))}
            </div>
          </div>

          {/* Barra de búsqueda y filtros laterales */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Búsqueda principal */}
            <div className="lg:col-span-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#040AE0] transition-all"
                />
              </div>
            </div>

            {/* Filtros laterales */}
            <div className="space-y-4">
              {/* Filtro por sede */}
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

              {/* Ordenar */}
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

              {/* Limpiar filtros */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 bg-[#141414] border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* Filtro de precio */}
          <div className="mt-6 bg-[#141414] rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Rango de precio</span>
              <span className="text-sm text-white">
                {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              </span>
            </div>
            <div className="flex gap-4">
              <input
                type="range"
                min={priceRangeLimits.min}
                max={priceRangeLimits.max}
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                className="flex-1 accent-[#040AE0]"
              />
              <input
                type="range"
                min={priceRangeLimits.min}
                max={priceRangeLimits.max}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="flex-1 accent-[#D604E0]"
              />
            </div>
          </div>
        </motion.div>

        {/* Resultados */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-400">
            Mostrando <span className="text-white font-medium">{productosFiltrados.length}</span> productos
          </p>
          {hasActiveFilters && (
            <p className="text-sm text-gray-500">
              Filtros activos aplicados
            </p>
          )}
        </div>

        {/* Grid de productos minimalista */}
        {productosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosFiltrados.map((producto, index) => (
              <motion.div
                key={producto.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => setSelectedProduct(producto)}
              >
                <div className="bg-[#0A0A0A] rounded-xl overflow-hidden border border-transparent hover:border-[#040AE0]/30 transition-all duration-300">
                  {/* Badge de destacado */}
                  {producto.destacado && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2 py-1 bg-[#040AE0] rounded-full text-white text-xs font-medium">
                        Destacado
                      </span>
                    </div>
                  )}

                  {/* Imagen del producto */}
                  <div className="aspect-square bg-gradient-to-br from-[#040AE0]/5 to-[#D604E0]/5 overflow-hidden">
                    {producto.imagen ? (
                      <img 
                        src={producto.imagen} 
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-[#040AE0]/20" />
                      </div>
                    )}
                  </div>

                  {/* Información minimalista */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        {producto.categoria}
                      </span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">{producto.sede.nombre}</span>
                      </div>
                    </div>

                    <h3 className="text-white font-medium mb-2 line-clamp-1 group-hover:text-[#040AE0] transition-colors">
                      {producto.nombre}
                    </h3>

                    <p className="text-gray-400 text-xs line-clamp-2 mb-3">
                      {producto.descripcion}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-white">
                        {formatPrice(producto.precio)}
                      </span>
                      {producto.stock > 0 ? (
                        <span className="text-xs text-green-500">
                          {producto.stock} disponibles
                        </span>
                      ) : (
                        <span className="text-xs text-red-500">
                          Agotado
                        </span>
                      )}
                    </div>

                    {/* Botón de acción */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(producto);
                      }}
                      disabled={producto.stock === 0}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                        producto.stock > 0
                          ? "bg-[#040AE0] hover:bg-[#040AE0]/80 text-white"
                          : "bg-gray-800 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {producto.stock > 0 ? "Agregar al carrito" : "Agotado"}
                    </button>
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
      </div>

      {/* Modal de detalles del producto minimalista */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto bg-[#0A0A0A] border border-white/10">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white text-xl">
                  {selectedProduct.nombre}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Imagen grande */}
                <div className="aspect-square bg-gradient-to-br from-[#040AE0]/5 to-[#D604E0]/5 rounded-xl overflow-hidden">
                  {selectedProduct.imagen ? (
                    <img 
                      src={selectedProduct.imagen} 
                      alt={selectedProduct.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-20 h-20 text-[#040AE0]/20" />
                    </div>
                  )}
                </div>

                {/* Información detallada */}
                <div className="space-y-6">
                  {/* Categoría y sede */}
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-[#141414] border border-white/10 rounded-full text-xs text-gray-400">
                      {selectedProduct.categoria}
                    </span>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-400">{selectedProduct.sede.nombre}</span>
                    </div>
                    {selectedProduct.destacado && (
                      <span className="px-3 py-1 bg-[#040AE0] rounded-full text-xs text-white">
                        Destacado
                      </span>
                    )}
                  </div>

                  {/* Precio */}
                  <div>
                    <div className="text-3xl font-bold text-white mb-2">
                      {formatPrice(selectedProduct.precio)}
                    </div>
                    {selectedProduct.stock > 0 ? (
                      <p className="text-green-500 font-medium">
                        ✅ {selectedProduct.stock} unidades disponibles
                      </p>
                    ) : (
                      <p className="text-red-500 font-medium">
                        ❌ Producto agotado
                      </p>
                    )}
                  </div>

                  {/* Descripción */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Descripción</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {selectedProduct.descripcion}
                    </p>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleAddToCart(selectedProduct)}
                      disabled={selectedProduct.stock === 0}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                        selectedProduct.stock > 0
                          ? "gradient-bg hover:opacity-90 text-white"
                          : "bg-gray-800 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <ShoppingBag className="w-5 h-5 inline mr-2" />
                      {selectedProduct.stock > 0 ? "Agregar al Carrito" : "Agotado"}
                    </button>
                    
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="px-6 py-3 bg-[#141414] border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
