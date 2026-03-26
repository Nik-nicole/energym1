import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Add connection pooling to the DATABASE_URL
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return dbUrl;
  
  // For Aiven PostgreSQL, ensure SSL and proper connection pooling
  if (dbUrl.includes('aiven') || dbUrl.includes('postgresql')) {
    const url = new URL(dbUrl);
    
    // Add SSL mode for Aiven (required)
    if (!url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require');
    }
    
    // Add connection pool parameters if not already present - REDUCED for Supabase free tier
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '3');
    }
    
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '20');
    }
    
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '10');
    }
    
    return url.toString();
  }
  
  // Fallback for other database providers - REDUCED pool size
  const poolParams = "connection_limit=3&pool_timeout=20&connect_timeout=10";
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
