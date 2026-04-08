import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addRopaProducts() {
  try {
    // Obtener la primera sede disponible
    const sede = await prisma.sede.findFirst();
    
    if (!sede) {
      console.error('No se encontró ninguna sede en la base de datos');
      return;
    }

    const ropaProducts = [
      {
        nombre: "Camiseta Energym Pro",
        descripcion: "Camiseta técnica de alto rendimiento con tecnología de secado rápido y diseño ergonómico. Perfecta para entrenamientos intensos.",
        precio: 85000,
        categoria: "ROPA",
        stock: 50,
        destacado: true,
        imagen: "https://images.unsplash.net/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
        sedeId: sede.id
      },
      {
        nombre: "Leggings Compression Fit",
        descripcion: "Leggings de compresión de alta calidad que brindan soporte muscular y máxima comodidad durante el ejercicio.",
        precio: 120000,
        categoria: "ROPA",
        stock: 35,
        destacado: true,
        imagen: "https://images.unsplash.net/photo-1584515979966-3bb0e227b4be?w=800&h=800&fit=crop",
        sedeId: sede.id
      },
      {
        nombre: "Sudadera Energym Hoodie",
        descripcion: "Sudadera con capucha perfecta para calentar antes de entrenar o para uso casual. Tejido suave y duradero.",
        precio: 95000,
        categoria: "ROPA",
        stock: 40,
        destacado: false,
        imagen: "https://images.unsplash.net/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop",
        sedeId: sede.id
      },
      {
        nombre: "Shorts Deportivos Athletic",
        descripcion: "Shorts deportivos ligeros y transpirables, ideales para correr, entrenar o actividades al aire libre.",
        precio: 65000,
        categoria: "ROPA",
        stock: 60,
        destacado: false,
        imagen: "https://images.unsplash.net/photo-1586790170083-2f9ceadc732d?w=800&h=800&fit=crop",
        sedeId: sede.id
      },
      {
        nombre: "Conjunto Deportivo Complete",
        descripcion: "Set completo incluyendo camiseta y shorts. Diseño moderno y tecnología de tejido avanzada para máximo rendimiento.",
        precio: 140000,
        categoria: "ROPA",
        stock: 25,
        destacado: true,
        imagen: "https://images.unsplash.net/photo-1571019613454-1cb2f99b2d8b?w=800&h=800&fit=crop",
        sedeId: sede.id
      }
    ];

    console.log('Agregando productos de ropa...');

    for (const product of ropaProducts) {
      const existingProduct = await prisma.producto.findFirst({
        where: { nombre: product.nombre }
      });

      if (!existingProduct) {
        await prisma.producto.create({
          data: product
        });
        console.log(`✓ Producto agregado: ${product.nombre}`);
      } else {
        console.log(`- El producto ya existe: ${product.nombre}`);
      }
    }

    console.log('\n¡Productos de ropa agregados exitosamente!');

  } catch (error) {
    console.error('Error al agregar productos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRopaProducts();
