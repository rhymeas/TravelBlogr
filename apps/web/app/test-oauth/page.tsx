'use client'

import { useState } from 'react'
import { useSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'

export default function TestOAuthPage() {
  const supabase = useSupabase()
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testOAuth = async () => {
    addLog('🔍 Testing OAuth configuration...')
    
    const currentOrigin = window.location.origin
    addLog(`Current origin: ${currentOrigin}`)
    
    const redirectTo = '/test-oauth'
    const callbackUrl = `${currentOrigin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
    addLog(`Callback URL: ${callbackUrl}`)
    
    addLog('🚀 Initiating OAuth...')
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    
    if (error) {
      addLog(`❌ Error: ${error.message}`)
    } else {
      addLog(`✅ OAuth initiated: ${JSON.stringify(data)}`)
    }
  }

  const checkSession = async () => {
    addLog('🔍 Checking current session...')
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      addLog(`❌ Error: ${error.message}`)
    } else if (session) {
      addLog(`✅ Session found: ${session.user.email}`)
    } else {
      addLog(`⚠️ No session`)
    }
  }

  const clearStorage = () => {
    localStorage.clear()
    sessionStorage.clear()
    addLog('🗑️ Cleared all storage')
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">OAuth Debug Test</h1>
      
      <div className="space-y-4 mb-8">
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Current Origin:</strong> {window.location.origin}</p>
          <p><strong>Current URL:</strong> {window.location.href}</p>
        </div>
        
        <div className="flex gap-4">
          <Button onClick={testOAuth}>
            Test Google OAuth
          </Button>
          <Button onClick={checkSession} variant="outline">
            Check Session
          </Button>
          <Button onClick={clearStorage} variant="destructive">
            Clear Storage
          </Button>
        </div>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
        <div className="space-y-1">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

