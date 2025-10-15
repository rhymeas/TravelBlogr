'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function TestAuthPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const { signIn, user, profile, isAuthenticated, isLoading, error } = useAuth()

  const handleTestSignIn = async () => {
    console.log('Testing sign-in...')
    const result = await signIn(email, password)
    console.log('Test result:', result)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <button
            onClick={handleTestSignIn}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Test Sign In'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Authentication State:</h2>
          <div className="text-sm space-y-1">
            <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
            <p><strong>User ID:</strong> {user?.id || 'None'}</p>
            <p><strong>User Email:</strong> {user?.email || 'None'}</p>
            <p><strong>Profile Name:</strong> {profile?.full_name || 'None'}</p>
          </div>
        </div>

        {isAuthenticated && (
          <div className="mt-4 p-4 bg-green-100 rounded">
            <h3 className="font-semibold text-green-800">✅ Authentication Successful!</h3>
            <p className="text-green-700">You are now logged in as {profile?.full_name}</p>
          </div>
        )}
      </div>
    </div>
  )
}
