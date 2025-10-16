'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { SignInModal } from '@/components/auth/SignInModal'

interface AuthModalContextType {
  showSignIn: (redirectTo?: string) => void
  hideSignIn: () => void
  isOpen: boolean
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [redirectTo, setRedirectTo] = useState<string | undefined>()

  const showSignIn = (redirect?: string) => {
    setRedirectTo(redirect)
    setIsOpen(true)
  }

  const hideSignIn = () => {
    setIsOpen(false)
    setRedirectTo(undefined)
  }

  return (
    <AuthModalContext.Provider value={{ showSignIn, hideSignIn, isOpen }}>
      {children}
      <SignInModal
        isOpen={isOpen}
        onClose={hideSignIn}
        redirectTo={redirectTo}
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

