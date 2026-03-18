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
          isActive: true,
          endDate: {
            gte: new Date()
          }
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
}
