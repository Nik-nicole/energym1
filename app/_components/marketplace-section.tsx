import { ShoppingBag, Star, MapPin } from "lucide-react";
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

interface MarketplaceSectionProps {
  productos: Producto[];
}

export function MarketplaceSection({ productos }: MarketplaceSectionProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const productosDestacados = productos.filter(p => p.destacado).slice(0, 8);

  return (
    <section id="marketplace" className="py-20 bg-[#050505]">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#040AE0]/10 rounded-full text-[#040AE0] text-sm font-medium mb-4">
            <ShoppingBag className="w-4 h-4" />
            Tienda
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Productos <span className="gradient-text">Premium</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Suplementos, accesorios y equipos de las mejores marcas. 
            Disponibles en todas nuestras sedes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {productosDestacados.map((producto, index) => (
            <div
              key={producto.id}
              className="bg-[#141414] rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group"
            >
              {/* Imagen del producto */}
              <div className="aspect-square bg-gradient-to-br from-[#040AE0]/10 to-[#D604E0]/10 rounded-xl mb-4 overflow-hidden">
                {producto.imagen ? (
                  <img 
                    src={producto.imagen} 
                    alt={producto.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-[#040AE0]/30" />
                  </div>
                )}
              </div>

              {/* Información del producto */}
              <div className="mb-4">
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
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                  {producto.descripcion}
                </p>
                <div className="flex items-center justify-between">
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
              </div>

              {/* Botón de acción */}
              <Link
                href={`/marketplace`}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 group"
              >
                <ShoppingBag className="w-4 h-4" />
                Ver más
              </Link>
            </div>
          ))}
        </div>

        {/* Botón para ver todos los productos */}
        <div className="text-center mt-12">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-8 py-4 gradient-bg rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
          >
            <ShoppingBag className="w-5 h-5" />
            Ver Todos los Productos
          </Link>
        </div>
      </div>
    </section>
  );
}
