/**
 * Helper functions for validating and checking plan status
 * Ensures consistent date validation across the application
 */

/**
 * Checks if a plan is currently active by validating:
 * 1. isActive is true
 * 2. endDate is either null (no expiration) or in the future
 */
export function isActivePlan(userPlan: any): boolean {
  if (!userPlan) return false;
  
  // Must be marked as active
  if (!userPlan.isActive) return false;
  
  // If no end date, it's active indefinitely
  if (!userPlan.endDate) return true;
  
  // Check if end date has passed
  const endDate = new Date(userPlan.endDate);
  const now = new Date();
  
  return endDate > now;
}

/**
 * Checks if a plan is valid considering both ACTIVE and FROZEN states
 * Used to determine if a user can purchase new plans
 */
export function isValidActivePlan(userPlan: any): boolean {
  if (!userPlan) return false;
  
  const status = userPlan.status || 'ACTIVE';
  
  // FROZEN plans always block purchases
  if (status === 'FROZEN') return true;
  
  // For ACTIVE plans, check if not expired
  if (status === 'ACTIVE') {
    if (!userPlan.endDate) return true;
    
    const endDate = new Date(userPlan.endDate);
    const now = new Date();
    
    return endDate > now;
  }
  
  return false;
}

/**
 * Checks if a plan has expired
 */
export function isPlanExpired(userPlan: any): boolean {
  if (!userPlan || !userPlan.endDate) return false;
  
  const endDate = new Date(userPlan.endDate);
  const now = new Date();
  
  return endDate <= now;
}

/**
 * Gets the display status of a plan considering expiration
 */
export function getPlanDisplayStatus(userPlan: any): 'ACTIVE' | 'FROZEN' | 'EXPIRED' | 'INACTIVE' {
  if (!userPlan) return 'INACTIVE';
  
  const status = userPlan.status || 'ACTIVE';
  
  // Check if expired first
  if (isPlanExpired(userPlan)) {
    return 'EXPIRED';
  }
  
  // Return the actual status
  if (status === 'FROZEN' && isValidActivePlan(userPlan)) {
    return 'FROZEN';
  }
  
  if (status === 'ACTIVE' && isActivePlan(userPlan)) {
    return 'ACTIVE';
  }
  
  return 'INACTIVE';
}

/**
 * Format date to locale string
 */
export function formatPlanDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calculate days remaining for a plan
 */
export function getDaysRemaining(endDate: Date | string | null): number | null {
  if (!endDate) return null;
  
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return 0;
  
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
