/**
 * Feature Flags
 * 
 * Centralized feature flag management for gradual rollout.
 * Flags can be controlled via environment variables.
 */

export const FEATURE_FLAGS = {
  // Smart POI System with GROQ orchestration
  SMART_POI_SYSTEM: process.env.NEXT_PUBLIC_ENABLE_SMART_POI === 'true',
  
  // GROQ POI validation
  GROQ_POI_VALIDATION: process.env.NEXT_PUBLIC_ENABLE_GROQ_VALIDATION === 'true',
  
  // Progressive loading
  PROGRESSIVE_LOADING: process.env.NEXT_PUBLIC_ENABLE_PROGRESSIVE_LOADING === 'true',
  
  // Batch processing for blog generation
  BATCH_BLOG_PROCESSING: process.env.NEXT_PUBLIC_ENABLE_BATCH_PROCESSING === 'true',
} as const

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag] === true
}

// Helper to log feature flag status
export function logFeatureFlags() {
  console.log('🚩 Feature Flags:')
  Object.entries(FEATURE_FLAGS).forEach(([key, value]) => {
    console.log(`   ${key}: ${value ? '✅ ENABLED' : '❌ DISABLED'}`)
  })
}

