import { prisma } from './prisma';
import { PrismaWrapper } from './connection-wrapper';

// Helper functions para reutilizar consultas comunes y evitar saturación

// Consultas de usuario optimizadas
export const userQueries = {
  // Obtener usuario por email con campos básicos
  async byEmail(email: string) {
    return await PrismaWrapper.execute(
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
      3 // 3 retries
    );
  },

  // Obtener usuario por ID con campos básicos
  async byId(id: string) {
    return await PrismaWrapper.execute(
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
      3
    );
  },

  // Obtener usuario con su sede
  async withSede(email: string) {
    return await PrismaWrapper.execute(
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
      3
    );
  },
};

// Consultas de producto optimizadas
export const productQueries = {
  // Obtener producto por ID para verificación
  async byId(id: string) {
    return await PrismaWrapper.execute(
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
      3
    );
  },

  // Obtener producto con detalles completos
  async withDetails(id: string) {
    return await PrismaWrapper.execute(
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
      3
    );
  },

  // Obtener productos destacados
  async featured() {
    return await PrismaWrapper.execute(
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
      3
    );
  },
};

// Consultas de plan optimizadas
export const planQueries = {
  // Obtener plan por ID para verificación
  async byId(id: string) {
    return await prisma.plan.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        precio: true,
        activo: true,
        tipo: true,
        esVip: true,
      },
    });
  },

  // Obtener plan con detalles completos
  async withDetails(id: string) {
    return await prisma.plan.findUnique({
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
    });
  },

  // Obtener todos los planes activos
  async all() {
    return await prisma.plan.findMany({
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
    });
  },
};

// Consultas de sede optimizadas
export const sedeQueries = {
  // Obtener todas las sedes activas
  async all() {
    return await prisma.sede.findMany({
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
    });
  },

  // Obtener sede por ID
  async byId(id: string) {
    return await prisma.sede.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        telefono: true,
        email: true,
        imagen: true,
        horario: true,
        activo: true,
      },
    });
  },

  // Obtener sede con payment gateway
  async withPaymentGateway(id: string) {
    return await prisma.sede.findUnique({
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
    });
  },
};

// Consultas de órdenes optimizadas
export const orderQueries = {
  // Obtener órdenes de producto por usuario
  async productByUser(userId: string) {
    return await prisma.productOrder.findMany({
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
    });
  },

  // Obtener órdenes de plan por usuario
  async planByUser(userId: string) {
    return await prisma.planOrder.findMany({
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
    });
  },
};

// Consultas de noticias optimizadas
export const noticiaQueries = {
  // Obtener noticias recientes
  async recent() {
    return await prisma.noticia.findMany({
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
    });
  },

  // Obtener noticia por ID
  async byId(id: string) {
    return await prisma.noticia.findUnique({
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
    });
  },
};
