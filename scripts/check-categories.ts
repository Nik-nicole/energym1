import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCategories() {
  try {
    const productos = await prisma.producto.findMany({
      select: {
        categoria: true,
        nombre: true,
      }
    });

    const categorias = [...new Set(productos.map(p => p.categoria))];
    
    console.log('Categorías existentes:');
    categorias.forEach(cat => {
      const count = productos.filter(p => p.categoria === cat).length;
      console.log(`- ${cat}: ${count} productos`);
    });

    console.log('\nTodos los productos:');
    productos.forEach(p => {
      console.log(`- ${p.nombre} (${p.categoria})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();
