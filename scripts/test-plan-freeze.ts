import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPlanFreezeLogic() {
  console.log('=== Prueba de lógica de congelamiento de planes ===\n');

  try {
    // 1. Obtener todos los usuarios con planes
    const usersWithPlans = await prisma.userPlan.findMany({
      include: {
        user: true,
        plan: true,
      },
    });

    console.log(`Usuarios con planes encontrados: ${usersWithPlans.length}`);

    if (usersWithPlans.length === 0) {
      console.log('No se encontraron usuarios con planes. Creando datos de prueba...');
      
      // Crear datos de prueba si no existen
      const testUser = await prisma.user.findFirst();
      const testPlan = await prisma.plan.findFirst();
      
      if (testUser && testPlan) {
        const testUserPlan = await prisma.userPlan.create({
          data: {
            userId: testUser.id,
            planId: testPlan.id,
            status: 'ACTIVE',
            isActive: true,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
          },
          include: {
            user: true,
            plan: true,
          },
        });
        
        console.log('Plan de prueba creado:', testUserPlan);
      }
    }

    // 2. Probar congelamiento
    const activePlan = await prisma.userPlan.findFirst({
      where: {
        status: 'ACTIVE',
        isActive: true,
      },
      include: {
        user: true,
        plan: true,
      },
    });

    if (activePlan) {
      console.log('\n--- Probando congelamiento ---');
      console.log('Plan antes de congelar:', {
        id: activePlan.id,
        status: activePlan.status,
        isActive: activePlan.isActive,
        freezeDate: activePlan.freezeDate,
        planName: activePlan.plan.nombre,
        userName: activePlan.user.firstName,
      });

      // Congelar el plan
      const frozenPlan = await prisma.userPlan.update({
        where: { id: activePlan.id },
        data: {
          status: 'FROZEN',
          isActive: false,
          freezeDate: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log('Plan después de congelar:', {
        id: frozenPlan.id,
        status: frozenPlan.status,
        isActive: frozenPlan.isActive,
        freezeDate: frozenPlan.freezeDate,
      });

      // 3. Simular paso del tiempo y probar descongelamiento
      console.log('\n--- Probando descongelamiento ---');
      
      // Simular 3 días congelados
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      
      const frozenPlanForTest = await prisma.userPlan.update({
        where: { id: frozenPlan.id },
        data: {
          freezeDate: threeDaysAgo,
        },
      });

      console.log('Fecha de congelación simulada:', frozenPlanForTest.freezeDate);

      // Calcular días congelados
      const now = new Date();
      const freezeDate = new Date(frozenPlanForTest.freezeDate!);
      const frozenDays = Math.floor((now.getTime() - freezeDate.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`Días congelados: ${frozenDays}`);

      // Calcular nueva endDate
      let newEndDate = new Date();
      if (frozenPlanForTest.endDate) {
        newEndDate = new Date(frozenPlanForTest.endDate);
      }

      // Extender endDate por los días congelados
      newEndDate.setDate(newEndDate.getDate() + frozenDays);

      console.log(`Nueva fecha de fin: ${newEndDate.toISOString()}`);

      // Descongelar el plan
      const unfrozenPlan = await prisma.userPlan.update({
        where: { id: frozenPlanForTest.id },
        data: {
          status: 'ACTIVE',
          isActive: true,
          freezeDate: null,
          endDate: newEndDate,
          updatedAt: new Date(),
        },
      });

      console.log('Plan después de descongelar:', {
        id: unfrozenPlan.id,
        status: unfrozenPlan.status,
        isActive: unfrozenPlan.isActive,
        freezeDate: unfrozenPlan.freezeDate,
        endDate: unfrozenPlan.endDate,
      });

      // 4. Probar validación de compra
      console.log('\n--- Probando validación de compra ---');
      
      const userId = unfrozenPlan.userId;
      
      // Verificar si puede comprar nuevo plan (no debería poder)
      const activeOrFrozenPlan = await prisma.userPlan.findFirst({
        where: {
          userId,
          status: {
            in: ['ACTIVE', 'FROZEN']
          }
        }
      });

      const canPurchase = !activeOrFrozenPlan;
      console.log(`¿Puede el usuario comprar nuevo plan? ${canPurchase}`);
      
      if (!canPurchase) {
        console.log(`Estado actual del plan: ${activeOrFrozenPlan?.status}`);
      }

      // 5. Probar desactivación
      console.log('\n--- Probando desactivación ---');
      
      const deactivatedPlan = await prisma.userPlan.update({
        where: { id: unfrozenPlan.id },
        data: {
          status: 'INACTIVE',
          isActive: false,
          endDate: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log('Plan desactivado:', {
        id: deactivatedPlan.id,
        status: deactivatedPlan.status,
        isActive: deactivatedPlan.isActive,
      });

      // Verificar si ahora puede comprar (debería poder)
      const canPurchaseAfterDeactivation = await prisma.userPlan.findFirst({
        where: {
          userId,
          status: {
            in: ['ACTIVE', 'FROZEN']
          }
        }
      });

      const canPurchaseNow = !canPurchaseAfterDeactivation;
      console.log(`¿Puede comprar después de desactivar? ${canPurchaseNow}`);

    } else {
      console.log('No se encontraron planes activos para probar');
    }

    console.log('\n=== Prueba completada exitosamente ===');

  } catch (error) {
    console.error('Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testPlanFreezeLogic();
