import { prisma } from './prisma';

// Connection wrapper with retry logic and connection management
export class PrismaWrapper {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  static async execute<T>(
    operation: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        // Check if it's a connection-related error
        if (
          error.message?.includes('connection') ||
          error.message?.includes('remaining connection slots') ||
          error.message?.includes('too many connections')
        ) {
          if (attempt === retries) {
            throw new Error(`Database connection failed after ${retries} attempts: ${error.message}`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
          continue;
        }
        
        // If it's not a connection error, throw immediately
        throw error;
      }
    }
    
    throw new Error(`Operation failed after ${retries} attempts`);
  }

  // Helper for batch operations to reduce connection count
  static async batch<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
    return this.execute(async () => {
      return Promise.all(operations.map(op => op()));
    });
  }

  // Helper for sequential operations when batch isn't possible
  static async sequential<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
    return this.execute(async () => {
      const results: T[] = [];
      for (const operation of operations) {
        results.push(await operation());
      }
      return results;
    });
  }
}
