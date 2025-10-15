'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function SimpleSignInPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, isAuthenticated, user, profile } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    console.log('Form submitted with:', { email, password })
    
    try {
      const result = await signIn(email, password)
      console.log('Sign-in result:', result)
      
      if (result.success) {
        console.log('Success! Redirecting to dashboard...')
        alert('Login successful! Redirecting to dashboard...')
        router.push('/dashboard')
      } else {
        console.error('Sign-in failed:', result.error)
        alert('Login failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Sign-in error:', error)
      alert('An error occurred: ' + error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full">
          <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Already Logged In!</h1>
          <p className="mb-4">Welcome back, {profile?.full_name || user?.email}!</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Simple Sign In Test</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Test Credentials:</h3>
          <p className="text-sm">Email: test@example.com</p>
          <p className="text-sm">Password: password123</p>
          <button
            type="button"
            onClick={() => {
              setEmail('test@example.com')
              setPassword('password123')
            }}
            className="mt-2 text-blue-600 hover:text-blue-700 underline text-sm"
          >
            Fill test credentials
          </button>
        </div>
      </div>
    </div>
  )
}
