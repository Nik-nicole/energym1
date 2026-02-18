import prisma from '../lib/db';

const paymentGateways = [
  {
    nombre: 'Bancolombia',
    tipo: 'Ahorros',
    cuentaBanco: '123-456789-0123'
  },
  {
    nombre: 'Davivienda',
    tipo: 'Corriente',
    cuentaBanco: '456-789012-3456'
  },
  {
    nombre: 'Nequi',
    tipo: 'Digital',
    cuentaBanco: '3001234567'
  },
  {
    nombre: 'DaviPlata',
    tipo: 'Digital',
    cuentaBanco: '3009876543'
  }
];

async function seedPaymentGateways() {
  try {
    console.log('Limpiando pasarelas de pago existentes...');
    await prisma.paymentGateway.deleteMany();
    
    console.log('Creando pasarelas de pago...');
    for (const gateway of paymentGateways) {
      await prisma.paymentGateway.create({
        data: gateway
      });
    }
    
    console.log('Pasarelas de pago creadas exitosamente');
  } catch (error) {
    console.error('Error creando pasarelas de pago:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPaymentGateways();
