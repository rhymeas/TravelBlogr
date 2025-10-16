'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Globe, Eye, EyeOff, Mail, Lock, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  redirectTo?: string
}

export function SignInModal({ isOpen, onClose, redirectTo }: SignInModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signInWithProvider } = useAuth()
  const router = useRouter()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn(email, password)

      if (result.success) {
        toast.success('Welcome back!')
        onClose()

        // Only redirect if redirectTo is explicitly provided
        if (redirectTo) {
          await new Promise(resolve => setTimeout(resolve, 100))
          router.push(redirectTo)
        }
        // Otherwise, stay on current page (modal will close)
      } else {
        toast.error(result.error || 'Failed to sign in')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithProvider('google')
      if (result.success) {
        toast.success('Signing in with Google...')
        onClose()
        // OAuth will handle redirect automatically
      } else {
        toast.error(result.error || 'Failed to sign in with Google')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - 25% smaller with adjusted height */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex max-h-[72vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Left side - Image */}
        <div className="hidden md:block md:w-1/2 relative">
          <Image
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=1000&fit=crop"
            alt="Travel destination"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <h3 className="text-3xl font-bold mb-2">Welcome Back!</h3>
            <p className="text-lg opacity-90">Continue your journey with TravelBlogr</p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full md:w-1/2 p-6 md:p-9 overflow-y-auto">
          <div className="max-w-md mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-rausch-500 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl text-airbnb-black font-semibold">TravelBlogr</span>
            </div>

            <h2 className="text-2xl font-bold text-airbnb-black mb-1">
              Sign in
            </h2>
            <p className="text-airbnb-dark-gray mb-6 text-sm">
              Welcome back! Please enter your details.
            </p>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-airbnb-black mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-airbnb-gray h-5 w-5" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-airbnb-black mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-airbnb-gray h-5 w-5" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-airbnb-gray hover:text-airbnb-dark-gray"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-3 w-3 text-rausch-500 focus:ring-rausch-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-1.5 block text-airbnb-dark-gray">
                    Remember me
                  </label>
                </div>

                <Link href="/auth/forgot-password" className="text-rausch-500 hover:text-rausch-600">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full text-sm"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-rausch-500 hover:text-rausch-600 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

