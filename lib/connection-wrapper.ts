import { prisma } from './prisma';

// Connection wrapper with retry logic and connection management
export class PrismaWrapper {
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_RETRY_DELAY = 1000; // 1 second
  private static readonly MAX_RETRY_DELAY = 10000; // 10 seconds

  /**
   * Checks if an error is a transient database connection error that should be retried
   */
  private static isTransientError(error: any): boolean {
    // Prisma error code P1001: Can't reach database server
    if (error.code === 'P1001') {
      return true;
    }
    
    // Check for connection-related error messages
    const errorMessage = error.message?.toLowerCase() || '';
    const transientErrorPatterns = [
      'connection',
      'remaining connection slots',
      'too many connections',
      'timeout',
      'network',
      'unreachable',
      'connection refused',
      'connection reset',
      'connection timed out',
      'database is locked',
      'could not connect',
      'connection lost'
    ];
    
    return transientErrorPatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Calculates exponential backoff delay with jitter
   */
  private static getRetryDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.BASE_RETRY_DELAY * Math.pow(2, attempt - 1),
      this.MAX_RETRY_DELAY
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Executes a Prisma operation with retry logic for transient errors
   */
  static async execute<T>(
    operation: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a transient error that should be retried
        if (this.isTransientError(error)) {
          if (attempt === retries) {
            // Log final retry attempt failure
            console.error(`Database operation failed after ${retries} attempts. Last error:`, {
              code: error.code,
              message: error.message,
              attempts: retries
            });
            throw new Error(`Database connection failed after ${retries} attempts: ${error.message}`);
          }
          
          const delay = this.getRetryDelay(attempt);
          console.warn(`Database connection issue (attempt ${attempt}/${retries}), retrying in ${delay}ms:`, {
            code: error.code,
            message: error.message
          });
          
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If it's not a transient error, throw immediately
        throw error;
      }
    }
    
    throw new Error(`Operation failed after ${retries} attempts: ${lastError?.message}`);
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
