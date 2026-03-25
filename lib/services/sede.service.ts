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
      async () => {
        // Ejecutar todas las operaciones en una transacción
        return await prisma.$transaction(async (tx) => {
          // 1. Eliminar usuarios asociados a la sede
          await tx.user.deleteMany({
            where: { sedeId }
          });

          // 2. Eliminar productos de la sede
          await tx.producto.deleteMany({
            where: { sedeId }
          });

          // 3. Eliminar noticias de la sede
          await tx.noticia.deleteMany({
            where: { sedeId }
          });

          // 4. Eliminar planes asociados a la sede
          await tx.planSede.deleteMany({
            where: { sedeId }
          });

          // 5. Eliminar órdenes de planes de la sede
          await tx.planOrder.deleteMany({
            where: { sedeId }
          });

          // 6. Eliminar órdenes de productos de la sede
          await tx.productOrder.deleteMany({
            where: { sedeId }
          });

          // 7. Eliminar pagos de la sede
          await tx.payment.deleteMany({
            where: { sedeId }
          });

          // 8. Finalmente eliminar la sede
          return await tx.sede.delete({
            where: { id: sedeId }
          });
        });
      },
      3
    );
  }
}
