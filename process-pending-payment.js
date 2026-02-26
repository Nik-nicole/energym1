// Script para procesar manualmente un pago pendiente
// Ejecutar con: node process-pending-payment.js

const { prisma } = require('./lib/prisma');

async function processPendingPayment() {
  console.log('⚡ Procesando pago pendiente...');
  
  try {
    // 1. Buscar la orden más reciente que esté pendiente
    const pendingOrder = await prisma.order.findFirst({
      where: {
        paymentStatus: 'PENDING',
        status: 'PENDING'
      },
      include: {
        items: {
          include: {
            plan: true,
          },
        },
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    if (!pendingOrder) {
      console.log('❌ No hay órdenes pendientes para procesar');
      return;
    }
    
    console.log(`\n📋 Orden encontrada: ${pendingOrder.orderNumber}`);
    console.log(`   Usuario: ${pendingOrder.user.firstName} ${pendingOrder.user.lastName}`);
    console.log(`   Plan: ${pendingOrder.items[0]?.plan?.nombre || 'No encontrado'}`);
    console.log(`   Total: $${pendingOrder.totalAmount}`);
    console.log(`   Estado actual: ${pendingOrder.status} | ${pendingOrder.paymentStatus}`);
    
    // 2. Procesar el pago (cambiar a CONFIRMED y PAID)
    console.log('\n⚙️ Procesando pago...');
    const updatedOrder = await prisma.order.update({
      where: { id: pendingOrder.id },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
      include: {
        items: {
          include: {
            plan: true,
          },
        },
        user: true,
      },
    });
    
    console.log('\n✅ Pago procesado exitosamente');
    console.log(`   Nuevo estado: ${updatedOrder.status} | ${updatedOrder.paymentStatus}`);
    console.log(`   Plan activado: ${updatedOrder.items[0]?.plan?.nombre}`);
    
    console.log('\n🎉 Ahora deberías ver el plan en el perfil del usuario');
    console.log(`   Usuario: ${updatedOrder.user.firstName} ${updatedOrder.user.lastName}`);
    console.log(`   Plan: ${updatedOrder.items[0]?.plan?.nombre}`);
    console.log(`   Duración: ${updatedOrder.items[0]?.plan?.duracion}`);
    console.log(`   Precio: $${updatedOrder.items[0]?.plan?.precio}`);
    
    console.log('\n📱 Pasos para verificar:');
    console.log('1. Inicia sesión en la aplicación');
    console.log('2. Ve a tu perfil');
    console.log('3. Deberías ver "Plan Activo" con la información del plan');
    
  } catch (error) {
    console.error('❌ Error al procesar pago:', error);
  } finally {
    await prisma.$disconnect();
  }
}

processPendingPayment();
