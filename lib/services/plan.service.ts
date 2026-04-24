import { prisma } from '../prisma';
import { planQueries } from '../query-helpers';
import { PrismaWrapper } from '../connection-wrapper';

export class PlanService {
  static async getPlanesBySedeId(sedeId: string) {
    return await PrismaWrapper.execute(
      () => prisma.planSede.findMany({
        where: { sedeId },
        include: {
          plan: true
        }
      }),
      3
    );
  }

  static async getPlanActivo(userId: string) {
    return await PrismaWrapper.execute(
      () => prisma.userPlan.findFirst({
        where: {
          userId,
          status: {
            in: ['ACTIVE', 'FROZEN']
          },
          OR: [
            {
              status: 'ACTIVE',
              endDate: {
                gte: new Date()
              }
            },
            {
              status: 'FROZEN'
            }
          ]
        },
        include: {
          plan: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      3
    );
  }

  static async getPlanById(planId: string) {
    return await planQueries.byId(planId);
  }

  static async getPlanWithDetails(planId: string) {
    return await planQueries.withDetails(planId);
  }

  static async getAllPlanes() {
    return await planQueries.all();
  }

  static async validatePlanAvailability(planId: string): Promise<boolean> {
    const plan = await this.getPlanById(planId);
    return !!(plan && plan.activo);
  }

  static async validatePlanInSede(planId: string, sedeId: string): Promise<boolean> {
    const planSede = await PrismaWrapper.execute(
      () => prisma.planSede.findUnique({
        where: {
          planId_sedeId: {
            planId,
            sedeId
          }
        }
      }),
      3
    );
    return !!planSede;
  }

  static async getUserPlans(userId: string) {
    return await PrismaWrapper.execute(
      () => prisma.userPlan.findMany({
        where: { userId },
        include: {
          plan: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      3
    );
  }

  static async activatePlanForUser(userId: string, planId: string, paymentId: string) {
    const plan = await this.getPlanById(planId);
    if (!plan) throw new Error('Plan no encontrado');

    const startDate = new Date();
    const endDate = new Date(startDate);
    
    // Calcular fecha de fin según la duración del plan
    if (plan.duracion.includes('mes')) {
      const months = parseInt(plan.duracion) || 1;
      endDate.setMonth(endDate.getMonth() + months);
    } else if (plan.duracion.includes('año')) {
      const years = parseInt(plan.duracion) || 1;
      endDate.setFullYear(endDate.getFullYear() + years);
    } else {
      // Por defecto 1 mes
      endDate.setMonth(endDate.getMonth() + 1);
    }

    return await PrismaWrapper.execute(
      () => prisma.userPlan.create({
        data: {
          userId,
          planId,
          startDate,
          endDate,
          isActive: true,
          status: 'ACTIVE',
          paymentId
        }
      }),
      3
    );
  }

  static async deactivatePlanForUser(userId: string, planId: string) {
    return await PrismaWrapper.execute(
      () => prisma.userPlan.updateMany({
        where: {
          userId,
          planId,
          isActive: true
        },
        data: {
          isActive: false,
          status: 'INACTIVE',
          endDate: new Date()
        }
      }),
      3
    );
  }

  static async updatePlan(planId: string, data: any) {
    return await PrismaWrapper.execute(
      () => prisma.plan.update({
        where: { id: planId },
        data: {
          ...data,
          updatedAt: new Date()
        }
      }),
      3
    );
  }

  static async createPlan(data: any) {
    return await PrismaWrapper.execute(
      () => prisma.plan.create({
        data: {
          ...data,
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }),
      3
    );
  }

  static async deletePlan(planId: string) {
    return await PrismaWrapper.execute(
      () => prisma.plan.update({
        where: { id: planId },
        data: {
          activo: false,
          updatedAt: new Date()
        }
      }),
      3
    );
  }

  static async canUserPurchaseNewPlan(userId: string): Promise<boolean> {
    const activeOrFrozenPlan = await PrismaWrapper.execute(
      () => prisma.userPlan.findFirst({
        where: {
          userId,
          status: {
            in: ['ACTIVE', 'FROZEN']
          },
          OR: [
            {
              status: 'ACTIVE',
              endDate: {
                gt: new Date()
              }
            },
            {
              status: 'FROZEN'
            }
          ]
        }
      }),
      3
    );
    
    return !activeOrFrozenPlan;
  }

  static async freezeUserPlan(userPlanId: string, userId: string) {
    const userPlan = await PrismaWrapper.execute(
      () => prisma.userPlan.findUnique({
        where: { id: userPlanId }
      }),
      3
    );

    if (!userPlan || userPlan.userId !== userId) {
      throw new Error('Plan no encontrado o no autorizado');
    }

    if (userPlan.status !== 'ACTIVE') {
      throw new Error('Solo se pueden congelar planes activos');
    }

    return await PrismaWrapper.execute(
      () => prisma.userPlan.update({
        where: { id: userPlanId },
        data: {
          status: 'FROZEN',
          isActive: false,
          freezeDate: new Date(),
          updatedAt: new Date()
        }
      }),
      3
    );
  }

  static async unfreezeUserPlan(userPlanId: string, userId: string) {
    const userPlan = await PrismaWrapper.execute(
      () => prisma.userPlan.findUnique({
        where: { id: userPlanId },
        include: { plan: true }
      }),
      3
    );

    if (!userPlan || userPlan.userId !== userId) {
      throw new Error('Plan no encontrado o no autorizado');
    }

    if (userPlan.status !== 'FROZEN') {
      throw new Error('Solo se pueden descongelar planes congelados');
    }

    if (!userPlan.freezeDate) {
      throw new Error('No se encontró fecha de congelación');
    }

    // Calcular días congelados
    const now = new Date();
    const freezeDate = new Date(userPlan.freezeDate);
    const frozenDays = Math.floor((now.getTime() - freezeDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calcular nueva endDate
    let newEndDate = new Date();
    if (userPlan.endDate) {
      newEndDate = new Date(userPlan.endDate);
    } else {
      // Calcular según duración del plan
      const duration = userPlan.plan.duracion.toLowerCase();
      if (duration.includes('mes')) {
        const months = parseInt(duration) || 1;
        newEndDate.setMonth(newEndDate.getMonth() + months);
      } else if (duration.includes('año')) {
        const years = parseInt(duration) || 1;
        newEndDate.setFullYear(newEndDate.getFullYear() + years);
      } else {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      }
    }

    // Extender endDate por los días congelados
    newEndDate.setDate(newEndDate.getDate() + frozenDays);

    return await PrismaWrapper.execute(
      () => prisma.userPlan.update({
        where: { id: userPlanId },
        data: {
          status: 'ACTIVE',
          isActive: true,
          freezeDate: null,
          endDate: newEndDate,
          updatedAt: new Date()
        }
      }),
      3
    );
  }

  static async getUserPlanStatus(userId: string) {
    return await PrismaWrapper.execute(
      () => prisma.userPlan.findMany({
        where: { userId },
        include: {
          plan: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      3
    );
  }
}
