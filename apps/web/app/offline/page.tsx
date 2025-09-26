import { Metadata } from 'next'
import { Button } from '@/components/ui/Button'
import { WifiOff, RefreshCw, Home, Plane } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Offline | TravelBlogr',
  description: 'You are currently offline. Some features may be limited.',
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Offline Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="h-10 w-10 text-gray-400" />
          </div>
          <div className="text-6xl mb-2">✈️</div>
        </div>

        {/* Title and Description */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          You're Offline
        </h1>
        <p className="text-gray-600 mb-6">
          Don't worry! You can still browse your cached trips and memories. 
          We'll sync everything once you're back online.
        </p>

        {/* Offline Features */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Available Offline:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• View your cached trips</li>
            <li>• Browse saved photos</li>
            <li>• Read offline posts</li>
            <li>• Create new content (syncs later)</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard/trips'}
            className="w-full flex items-center justify-center gap-2"
          >
            <Plane className="h-4 w-4" />
            View My Trips
          </Button>
        </div>

        {/* Connection Status */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Connection will be restored automatically when available
          </p>
          <div className="flex items-center justify-center mt-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-2"></div>
            <span className="text-xs text-gray-600">Offline Mode</span>
          </div>
        </div>
      </div>

      {/* Background Animation */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  )
}
