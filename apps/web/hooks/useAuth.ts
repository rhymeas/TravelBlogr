/**
 * Re-export useAuth from AuthContext for backward compatibility
 * This allows existing code to continue using `import { useAuth } from '@/hooks/useAuth'`
 * while the actual implementation is in the AuthContext provider.
 */

export { useAuth } from '@/contexts/AuthContext'
