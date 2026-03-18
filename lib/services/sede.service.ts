import { prisma } from '../prisma';
import { sedeQueries } from '../query-helpers';
import { PrismaWrapper } from '../connection-wrapper';

export class SedeService {
  static async getSedesActivas() {
    return await sedeQueries.all();
  }

  static async getSedeWithPlanes(sedeId: string) {
    return await PrismaWrapper.execute(
      () => prisma.sede.findUnique({
        where: { id: sedeId },
        include: {
          planesEnSede: {
            include: {
              plan: true
            }
          },
          paymentGateway: true
        }
      }),
      3
    );
  }

  static async getSedeById(sedeId: string) {
    return await sedeQueries.byId(sedeId);
  }

  static async getSedeWithPaymentGateway(sedeId: string) {
    return await sedeQueries.withPaymentGateway(sedeId);
  }

  static async validateSedeAvailability(sedeId: string): Promise<boolean> {
    const sede = await this.getSedeById(sedeId);
    return !!(sede && sede.activo);
  }

  static async updateSede(sedeId: string, data: any) {
    return await PrismaWrapper.execute(
      () => prisma.sede.update({
        where: { id: sedeId },
        data: {
          ...data,
          updatedAt: new Date()
        }
      }),
      3
    );
  }

  static async createSede(data: any) {
    return await PrismaWrapper.execute(
      () => prisma.sede.create({
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

  static async deleteSede(sedeId: string) {
    return await PrismaWrapper.execute(
      () => prisma.sede.update({
        where: { id: sedeId },
        data: {
          activo: false,
          updatedAt: new Date()
        }
      }),
      3
    );
  }
}
