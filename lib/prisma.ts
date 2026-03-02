import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Add connection pooling to the DATABASE_URL
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return dbUrl;
  
  // Add connection pool parameters if not already present
  const poolParams = "connection_limit=10&pool_timeout=20";
  const separator = dbUrl.includes("?") ? "&" : "?";
  
  return dbUrl.includes("connection_limit") ? dbUrl : `${dbUrl}${separator}${poolParams}`;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Función para desconectar Prisma en producción
export async function disconnectPrisma() {
  if (process.env.NODE_ENV === "production" && globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
}
