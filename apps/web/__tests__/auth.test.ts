/**
 * Authentication Test Suite
 * Tests the mock authentication system with test account credentials
 */

import { describe, it, expect, beforeEach } from '@jest/globals'

// Mock the authentication hook for testing
const mockAuth = {
  TEST_ACCOUNTS: {
    'test@example.com': {
      password: 'password123',
      profile: {
        id: 'test-user-id',
        full_name: 'Test User',
        avatar_url: undefined,
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString(),
      }
    }
  },

  async signIn(email: string, password: string) {
    // Validate test account credentials
    if (email in this.TEST_ACCOUNTS) {
      const testAccount = this.TEST_ACCOUNTS[email as keyof typeof this.TEST_ACCOUNTS]
      if (password !== testAccount.password) {
        return { success: false, error: 'Invalid email or password' }
      }
      return { 
        success: true, 
        data: { 
          user: { id: testAccount.profile.id, email },
          profile: testAccount.profile
        }
      }
    }
    
    // Allow any other credentials for demo
    return { 
      success: true, 
      data: { 
        user: { id: 'demo-user-id', email },
        profile: { id: 'demo-user-id', email, full_name: 'Demo User' }
      }
    }
  }
}

describe('Authentication System', () => {
  beforeEach(() => {
    // Reset any state before each test
  })

  describe('Test Account Login', () => {
    it('should successfully authenticate with test credentials', async () => {
      const result = await mockAuth.signIn('test@example.com', 'password123')
      
      expect(result.success).toBe(true)
      expect(result.data?.user.email).toBe('test@example.com')
      expect(result.data?.profile.full_name).toBe('Test User')
      expect(result.data?.profile.id).toBe('test-user-id')
    })

    it('should reject invalid password for test account', async () => {
      const result = await mockAuth.signIn('test@example.com', 'wrongpassword')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
    })

    it('should allow demo login with any other credentials', async () => {
      const result = await mockAuth.signIn('demo@example.com', 'anypassword')
      
      expect(result.success).toBe(true)
      expect(result.data?.user.email).toBe('demo@example.com')
      expect(result.data?.profile.full_name).toBe('Demo User')
    })
  })

  describe('Test Account Profile', () => {
    it('should return correct profile data for test account', async () => {
      const result = await mockAuth.signIn('test@example.com', 'password123')
      
      expect(result.data?.profile).toEqual({
        id: 'test-user-id',
        full_name: 'Test User',
        avatar_url: undefined,
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: expect.any(String),
      })
    })
  })

  describe('Authentication Validation', () => {
    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user@domain.co.uk',
        'name.surname@company.org'
      ]
      
      validEmails.forEach(email => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        expect(isValid).toBe(true)
      })
    })

    it('should validate password requirements', () => {
      const testPassword = 'password123'
      
      // Basic password validation
      expect(testPassword.length).toBeGreaterThanOrEqual(8)
      expect(testPassword).toMatch(/[a-zA-Z]/) // Contains letters
      expect(testPassword).toMatch(/[0-9]/) // Contains numbers
    })
  })
})

// Export test utilities for use in other tests
export const testCredentials = {
  email: 'test@example.com',
  password: 'password123',
  expectedProfile: {
    id: 'test-user-id',
    full_name: 'Test User',
    email: 'test@example.com'
  }
}

export const demoCredentials = {
  email: 'demo@example.com',
  password: 'anypassword',
  expectedProfile: {
    id: 'demo-user-id',
    full_name: 'Demo User'
  }
}
