// Script para agregar productos de ropa mediante la API local
const ropaProducts = [
  {
    nombre: "Camiseta Energym Pro",
    descripcion: "Camiseta técnica de alto rendimiento con tecnología de secado rápido y diseño ergonómico. Perfecta para entrenamientos intensos.",
    precio: 85000,
    categoria: "ROPA",
    stock: 50,
    destacado: true,
    imagen: "https://images.unsplash.net/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop"
  },
  {
    nombre: "Leggings Compression Fit",
    descripcion: "Leggings de compresión de alta calidad que brindan soporte muscular y máxima comodidad durante el ejercicio.",
    precio: 120000,
    categoria: "ROPA",
    stock: 35,
    destacado: true,
    imagen: "https://images.unsplash.net/photo-1584515979966-3bb0e227b4be?w=800&h=800&fit=crop"
  },
  {
    nombre: "Sudadera Energym Hoodie",
    descripcion: "Sudadera con capucha perfecta para calentar antes de entrenar o para uso casual. Tejido suave y duradero.",
    precio: 95000,
    categoria: "ROPA",
    stock: 40,
    destacado: false,
    imagen: "https://images.unsplash.net/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop"
  },
  {
    nombre: "Shorts Deportivos Athletic",
    descripcion: "Shorts deportivos ligeros y transpirables, ideales para correr, entrenar o actividades al aire libre.",
    precio: 65000,
    categoria: "ROPA",
    stock: 60,
    destacado: false,
    imagen: "https://images.unsplash.net/photo-1586790170083-2f9ceadc732d?w=800&h=800&fit=crop"
  },
  {
    nombre: "Conjunto Deportivo Complete",
    descripcion: "Set completo incluyendo camiseta y shorts. Diseño moderno y tecnología de tejido avanzada para máximo rendimiento.",
    precio: 140000,
    categoria: "ROPA",
    stock: 25,
    destacado: true,
    imagen: "https://images.unsplash.net/photo-1571019613454-1cb2f99b2d8b?w=800&h=800&fit=crop"
  }
];

console.log('Productos de ropa para agregar:');
ropaProducts.forEach((product, index) => {
  console.log(`${index + 1}. ${product.nombre} - $${product.precio.toLocaleString('es-CO')} - ${product.categoria}`);
});

console.log('\nPara agregar estos productos, usa la API de admin o agrégalos manualmente desde el panel de administración.');
console.log('Los productos están listos para ser importados.');
