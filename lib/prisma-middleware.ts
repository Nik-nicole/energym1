import { prisma } from './prisma';

// Middleware para manejar conexiones de Prisma
export class PrismaManager {
  private static instance: PrismaManager;
  private connectionCount = 0;
  private maxConnections = 20; // Límite de conexiones simultáneas

  private constructor() {}

  static getInstance(): PrismaManager {
    if (!PrismaManager.instance) {
      PrismaManager.instance = new PrismaManager();
    }
    return PrismaManager.instance;
  }

  async executeQuery<T>(query: () => Promise<T>): Promise<T> {
    if (this.connectionCount >= this.maxConnections) {
      // Esperar un poco si hay demasiadas conexiones
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.connectionCount++;
    try {
      return await query();
    } finally {
      this.connectionCount--;
    }
  }

  getConnectionCount(): number {
    return this.connectionCount;
  }
}

// Wrapper para ejecutar queries con manejo de conexiones
export async function withPrismaQuery<T>(query: () => Promise<T>): Promise<T> {
  const manager = PrismaManager.getInstance();
  return manager.executeQuery(query);
}
