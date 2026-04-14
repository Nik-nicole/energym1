// Script para verificar todos los pagos y sus transactionIds
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllPayments() {
  try {
    console.log("[Check] Buscando todos los pagos...");
    
    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { transactionId: { contains: "LNK_VDW3NK05JA" } },
          { transactionId: { contains: "ORD-cmm2734i" } }
        ]
      },
      include: {
        productOrders: true
      }
    });
    
    console.log(`[Check] Encontrados ${payments.length} pagos:`);
    
    payments.forEach((payment, index) => {
      console.log(`\n[Check] Pago ${index + 1}:`);
      console.log(`  ID: ${payment.id}`);
      console.log(`  TransactionId: ${payment.transactionId}`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Amount: ${payment.amount}`);
      console.log(`  ProductOrders: ${payment.productOrders.length}`);
      
      payment.productOrders.forEach(order => {
        console.log(`    - Orden: ${order.id} (Status: ${order.status})`);
      });
    });
    
    // Verificar si hay duplicados
    const transactionIds = payments.map(p => p.transactionId);
    const duplicates = transactionIds.filter((id, index) => transactionIds.indexOf(id) !== index);
    
    if (duplicates.length > 0) {
      console.log(`\n[Check] ADVERTENCIA: Hay transactionIds duplicados:`, duplicates);
    } else {
      console.log(`\n[Check] No hay duplicados en transactionIds`);
    }
    
  } catch (error) {
    console.error("[Check] Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllPayments();
