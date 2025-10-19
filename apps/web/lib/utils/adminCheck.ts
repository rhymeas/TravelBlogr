/**
 * Admin Check Utility
 * 
 * Centralized admin permission checking.
 * Add admin emails here to grant admin access.
 */

const ADMIN_EMAILS = [
  'admin@travelblogr.com',
  'rimas.albert@googlemail.com', // Your email
]

/**
 * Check if a user is an admin
 * @param email - User's email address
 * @returns true if user is admin, false otherwise
 */
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false
  
  // Check exact match
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return true
  }
  
  // Check if email contains 'admin'
  if (email.toLowerCase().includes('admin')) {
    return true
  }
  
  return false
}

/**
 * Get list of admin emails (for debugging)
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS]
}

