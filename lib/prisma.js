const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // 🔥 CONFIGURACIÓN OPTIMIZADA PARA PRODUCCIÓN
    // Connection pooling para evitar saturación
    __internal: {
      engine: {
        // Límite de conexiones simultáneas
        connectionLimit: 20,
        // Timeout para conexiones inactivas
        poolTimeout: 10000,
        // Tiempo de vida de las conexiones
        connectionTimeout: 20000,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Función para desconectar Prisma en producción
async function disconnectPrisma() {
  if (process.env.NODE_ENV === "production" && globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
}

// Función para verificar salud de la conexión
async function checkConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

module.exports = { prisma, disconnectPrisma, checkConnection };
