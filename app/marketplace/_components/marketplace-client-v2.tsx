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

export function MarketplaceClientV2({ productos, sedes }: MarketplaceClientProps) {
  const { addItem, items } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSede, setSelectedSede] = useState<string>("all");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("destacado");
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSede("all");
    setSelectedCategoria("all");
    setSortBy("destacado");
  };

  const hasActiveFilters = searchTerm || selectedSede !== "all" || selectedCategoria !== "all";

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

        {/* Barra de búsqueda y filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda principal */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#141414] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#040AE0] transition-all"
              />
            </div>

            {/* Botón de filtros */}
            <Button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-6 py-4 rounded-xl font-medium transition-all ${
                hasActiveFilters
                  ? "gradient-bg text-white"
                  : "bg-[#141414] border border-white/10 text-white hover:border-[#040AE0]"
              }`}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                  Activo
                </span>
              )}
            </Button>

            {/* Botón limpiar filtros */}
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="outline"
                className="px-6 py-4 rounded-xl border border-white/10 text-white hover:bg-white/10"
              >
                <X className="w-5 h-5 mr-2" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Panel de filtros desplegable */}
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#141414] rounded-2xl p-6 border border-white/10 mt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro por sede */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Sede</label>
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
                </div>

                {/* Filtro por categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Categoría</label>
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
                </div>

                {/* Ordenar */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Ordenar por</label>
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
              </div>
            </motion.div>
          )}
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

        {/* Grid de productos */}
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
                <div className="bg-[#141414] rounded-2xl border border-white/10 hover:border-[#040AE0]/50 transition-all duration-300 overflow-hidden">
                  {/* Badge de destacado */}
                  {producto.destacado && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-[#D604E0] text-white border-none">
                        Destacado
                      </Badge>
                    </div>
                  )}

                  {/* Imagen del producto */}
                  <div className="aspect-square bg-gradient-to-br from-[#040AE0]/10 to-[#D604E0]/10 overflow-hidden">
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
                      <Badge variant="outline" className="border-[#040AE0] text-[#040AE0]">
                        {producto.categoria}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{producto.sede.nombre}</span>
                      </div>
                    </div>

                    <h3 className="text-white font-bold mb-2 line-clamp-2 group-hover:text-[#040AE0] transition-colors">
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
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          Stock: {producto.stock}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500 text-red-500">
                          Agotado
                        </Badge>
                      )}
                    </div>

                    {/* Botón de acción rápida */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(producto);
                        }}
                        disabled={producto.stock === 0}
                        className={`flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          producto.stock > 0
                            ? "gradient-bg hover:opacity-90 text-white"
                            : "bg-gray-700 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        {producto.stock > 0 ? "Agregar" : "Agotado"}
                      </Button>
                      
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(producto);
                        }}
                        variant="outline"
                        className="px-3 py-2 border-white/10 text-white hover:bg-white/10"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
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

      {/* Modal de detalles del producto */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-[#141414] border-[#1E1E1E]">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="gradient-text text-xl">
                  {selectedProduct.nombre}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Imagen grande */}
                <div className="aspect-square bg-gradient-to-br from-[#040AE0]/10 to-[#D604E0]/10 rounded-2xl overflow-hidden">
                  {selectedProduct.imagen ? (
                    <img 
                      src={selectedProduct.imagen} 
                      alt={selectedProduct.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-24 h-24 text-[#040AE0]/30" />
                    </div>
                  )}
                </div>

                {/* Información detallada */}
                <div className="space-y-6">
                  {/* Categoría y sede */}
                  <div className="flex items-center gap-4">
                    <Badge className="bg-[#040AE0] text-white border-none">
                      {selectedProduct.categoria}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">{selectedProduct.sede.nombre}</span>
                    </div>
                    {selectedProduct.destacado && (
                      <Badge className="bg-[#D604E0] text-white border-none">
                        Destacado
                      </Badge>
                    )}
                  </div>

                  {/* Precio */}
                  <div>
                    <div className="text-3xl font-bold gradient-text mb-2">
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
                    <Button
                      onClick={() => handleAddToCart(selectedProduct)}
                      disabled={selectedProduct.stock === 0}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        selectedProduct.stock > 0
                          ? "gradient-bg hover:opacity-90 text-white"
                          : "bg-gray-700 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      {selectedProduct.stock > 0 ? "Agregar al Carrito" : "Agotado"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setSelectedProduct(null)}
                      className="px-6 py-3 border-white/10 text-white hover:bg-white/10"
                    >
                      Cerrar
                    </Button>
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
