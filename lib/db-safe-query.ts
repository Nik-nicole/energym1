import { PrismaClient } from '@prisma/client';
import { PrismaWrapper } from './connection-wrapper';
import { prisma } from './prisma';

/**
 * Safe query wrapper that provides automatic retry logic for Prisma operations
 * This helps handle intermittent database connection issues (like P1001 errors)
 */
export class SafeQuery {
  /**
   * Execute a Prisma query with automatic retry for transient errors
   * 
   * @param operation - The Prisma operation to execute
   * @param options - Optional configuration for retry behavior
   * @returns Promise with the result of the operation
   */
  static async execute<T>(
    operation: () => Promise<T>,
    options?: {
      retries?: number;
      context?: string; // For better logging
    }
  ): Promise<T> {
    const context = options?.context || 'database operation';
    
    return PrismaWrapper.execute(operation, options?.retries);
  }

  /**
   * Safe user queries with retry logic
   */
  static readonly user = {
    async findByEmail(email: string) {
      return SafeQuery.execute(
        () => prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            sedeId: true,
            image: true,
          },
        }),
        { context: 'user.findByEmail' }
      );
    },

    async findById(id: string) {
      return SafeQuery.execute(
        () => prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            sedeId: true,
            image: true,
          },
        }),
        { context: 'user.findById' }
      );
    },

    async findWithSede(email: string) {
      return SafeQuery.execute(
        () => prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            sedeId: true,
            image: true,
            sede: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        }),
        { context: 'user.findWithSede' }
      );
    },

    async create(data: any) {
      return SafeQuery.execute(
        () => prisma.user.create({ data }),
        { context: 'user.create' }
      );
    },

    async update(id: string, data: any) {
      return SafeQuery.execute(
        () => prisma.user.update({ where: { id }, data }),
        { context: 'user.update' }
      );
    },
  };

  /**
   * Safe product queries with retry logic
   */
  static readonly product = {
    async findById(id: string) {
      return SafeQuery.execute(
        () => prisma.producto.findUnique({
          where: { id },
          select: {
            id: true,
            nombre: true,
            precio: true,
            stock: true,
            activo: true,
            sedeId: true,
          },
        }),
        { context: 'product.findById' }
      );
    },

    async findWithDetails(id: string) {
      return SafeQuery.execute(
        () => prisma.producto.findUnique({
          where: { id },
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            precio: true,
            imagen: true,
            categoria: true,
            stock: true,
            activo: true,
            destacado: true,
            sedeId: true,
            sede: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        }),
        { context: 'product.findWithDetails' }
      );
    },

    async findFeatured() {
      return SafeQuery.execute(
        () => prisma.producto.findMany({
          where: { activo: true },
          select: {
            id: true,
            nombre: true,
            precio: true,
            imagen: true,
            categoria: true,
            destacado: true,
            stock: true,
            sede: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
          orderBy: { destacado: "desc" },
          take: 8,
        }),
        { context: 'product.findFeatured' }
      );
    },

    async create(data: any) {
      return SafeQuery.execute(
        () => prisma.producto.create({ data }),
        { context: 'product.create' }
      );
    },

    async update(id: string, data: any) {
      return SafeQuery.execute(
        () => prisma.producto.update({ where: { id }, data }),
        { context: 'product.update' }
      );
    },
  };

  /**
   * Safe plan queries with retry logic
   */
  static readonly plan = {
    async findById(id: string) {
      return SafeQuery.execute(
        () => prisma.plan.findUnique({
          where: { id },
          select: {
            id: true,
            nombre: true,
            precio: true,
            activo: true,
            tipo: true,
            esVip: true,
          },
        }),
        { context: 'plan.findById' }
      );
    },

    async findWithDetails(id: string) {
      return SafeQuery.execute(
        () => prisma.plan.findUnique({
          where: { id },
          select: {
            id: true,
            nombre: true,
            precio: true,
            descripcion: true,
            beneficios: true,
            duracion: true,
            tipo: true,
            esVip: true,
            activo: true,
            destacado: true,
            orden: true,
            sedes: {
              select: {
                sede: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
            },
          },
        }),
        { context: 'plan.findWithDetails' }
      );
    },

    async findAll() {
      return SafeQuery.execute(
        () => prisma.plan.findMany({
          where: { activo: true },
          select: {
            id: true,
            nombre: true,
            precio: true,
            descripcion: true,
            beneficios: true,
            duracion: true,
            tipo: true,
            esVip: true,
            destacado: true,
            orden: true,
            sedes: {
              select: {
                sede: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
            },
          },
          orderBy: { orden: "asc" },
        }),
        { context: 'plan.findAll' }
      );
    },
  };

  /**
   * Safe sede queries with retry logic
   */
  static readonly sede = {
    async findAll() {
      return SafeQuery.execute(
        () => prisma.sede.findMany({
          where: { activo: true },
          select: {
            id: true,
            nombre: true,
            direccion: true,
            telefono: true,
            email: true,
            imagen: true,
            horario: true,
          },
          orderBy: { nombre: "asc" },
        }),
        { context: 'sede.findAll' }
      );
    },

    async findById(id: string) {
      return SafeQuery.execute(
        () => prisma.sede.findUnique({
          where: { id },
          select: {
            id: true,
            nombre: true,
            direccion: true,
            telefono: true,
            email: true,
            imagen: true,
            horario: true,
          },
        }),
        { context: 'sede.findById' }
      );
    },

    async findWithPaymentGateway(id: string) {
      return SafeQuery.execute(
        () => prisma.sede.findUnique({
          where: { id },
          select: {
            id: true,
            nombre: true,
            paymentGateway: {
              select: {
                id: true,
                nombre: true,
                tipo: true,
                cuentaBanco: true,
              },
            },
          },
        }),
        { context: 'sede.findWithPaymentGateway' }
      );
    },
  };

  /**
   * Safe order queries with retry logic
   */
  static readonly order = {
    async findProductByUser(userId: string) {
      return SafeQuery.execute(
        () => prisma.productOrder.findMany({
          where: { userId },
          select: {
            id: true,
            totalPrice: true,
            status: true,
            createdAt: true,
            quantity: true,
            unitPrice: true,
            product: {
              select: {
                id: true,
                nombre: true,
                imagen: true,
              },
            },
            sede: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        { context: 'order.findProductByUser' }
      );
    },

    async findPlanByUser(userId: string) {
      return SafeQuery.execute(
        () => prisma.planOrder.findMany({
          where: { userId },
          select: {
            id: true,
            totalPrice: true,
            status: true,
            createdAt: true,
            quantity: true,
            unitPrice: true,
            plan: {
              select: {
                id: true,
                nombre: true,
                tipo: true,
                duracion: true,
              },
            },
            sede: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        { context: 'order.findPlanByUser' }
      );
    },

    async createProductOrder(data: any) {
      return SafeQuery.execute(
        () => prisma.productOrder.create({ data }),
        { context: 'order.createProductOrder' }
      );
    },

    async createPlanOrder(data: any) {
      return SafeQuery.execute(
        () => prisma.planOrder.create({ data }),
        { context: 'order.createPlanOrder' }
      );
    },
  };

  /**
   * Safe payment queries with retry logic
   */
  static readonly payment = {
    async create(data: any) {
      return SafeQuery.execute(
        () => prisma.payment.create({ data }),
        { context: 'payment.create' }
      );
    },

    async updateStatus(id: string, status: string) {
      return SafeQuery.execute(
        () => prisma.payment.update({
          where: { id },
          data: { status }
        }),
        { context: 'payment.updateStatus' }
      );
    },

    async findByTransactionId(transactionId: string) {
      return SafeQuery.execute(
        () => prisma.payment.findUnique({
          where: { transactionId }
        }),
        { context: 'payment.findByTransactionId' }
      );
    },
  };

  /**
   * Safe noticia queries with retry logic
   */
  static readonly noticia = {
    async findRecent() {
      return SafeQuery.execute(
        () => prisma.noticia.findMany({
          where: { activo: true },
          select: {
            id: true,
            titulo: true,
            resumen: true,
            imagen: true,
            fechaPublicacion: true,
            destacado: true,
            sede: {
              select: {
                nombre: true,
              },
            },
          },
          orderBy: { fechaPublicacion: "desc" },
          take: 4,
        }),
        { context: 'noticia.findRecent' }
      );
    },

    async findById(id: string) {
      return SafeQuery.execute(
        () => prisma.noticia.findUnique({
          where: { id },
          select: {
            id: true,
            titulo: true,
            contenido: true,
            resumen: true,
            imagen: true,
            fechaPublicacion: true,
            destacado: true,
            esPromocion: true,
            fechaInicio: true,
            fechaFin: true,
            sede: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        }),
        { context: 'noticia.findById' }
      );
    },
  };

  /**
   * Generic safe query method for custom operations
   */
  static async query<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    return this.execute(operation, { context });
  }

  /**
   * Safe transaction execution
   */
  static async transaction<T>(
    operations: (tx: any) => Promise<T>,
    context?: string
  ): Promise<T> {
    return this.execute(
      () => prisma.$transaction(operations),
      { context: context || 'database transaction' }
    );
  }
}

// Export a default instance for convenience
export default SafeQuery;
