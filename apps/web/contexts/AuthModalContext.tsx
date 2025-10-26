'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SignInModal } from '@/components/auth/SignInModal'

interface HeroContent {
  title: string
  subtitle: string
  features?: Array<{
    icon: React.ReactNode
    title: string
    description: string
  }>
}

interface AuthModalContextType {
  showSignIn: (redirectTo?: string, heroContent?: HeroContent) => void
  hideSignIn: (userSignedIn?: boolean) => void
  isOpen: boolean
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/trips', '/profile', '/settings']

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [redirectTo, setRedirectTo] = useState<string | undefined>()
  const [heroContent, setHeroContent] = useState<HeroContent | undefined>()
  const router = useRouter()
  const pathname = usePathname()

  const showSignIn = (redirect?: string, customHeroContent?: HeroContent) => {
    setRedirectTo(redirect)
    setHeroContent(customHeroContent)
    setIsOpen(true)
  }

  const hideSignIn = (userSignedIn = false) => {
    setIsOpen(false)
    setRedirectTo(undefined)
    setHeroContent(undefined)

    // Only redirect if user did NOT sign in and is on a protected route
    if (!userSignedIn) {
      const isOnProtectedRoute = PROTECTED_ROUTES.some(route =>
        pathname?.startsWith(route)
      )

      // If on protected route and modal is being closed without signing in,
      // redirect to home page
      if (isOnProtectedRoute) {
        router.push('/')
      }
    }
  }

  return (
    <AuthModalContext.Provider value={{ showSignIn, hideSignIn, isOpen }}>
      {children}
      <SignInModal
        isOpen={isOpen}
        onClose={hideSignIn}
        redirectTo={redirectTo}
        heroContent={heroContent}
      />
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}

