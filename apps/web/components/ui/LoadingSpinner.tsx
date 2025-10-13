'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
}

const variantClasses = {
  primary: 'border-rausch-500 border-t-transparent',
  secondary: 'border-gray-300 border-t-transparent',
  white: 'border-white border-t-transparent',
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary',
  className 
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
}

const dotSizeClasses = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-3 w-3',
}

const dotVariantClasses = {
  primary: 'bg-rausch-500',
  secondary: 'bg-gray-400',
  white: 'bg-white',
}

export function LoadingDots({ 
  size = 'md', 
  variant = 'primary',
  className 
}: LoadingDotsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)} role="status" aria-label="Loading">
      <div
        className={cn(
          'rounded-full animate-bounce',
          dotSizeClasses[size],
          dotVariantClasses[variant]
        )}
        style={{ animationDelay: '0ms' }}
      />
      <div
        className={cn(
          'rounded-full animate-bounce',
          dotSizeClasses[size],
          dotVariantClasses[variant]
        )}
        style={{ animationDelay: '150ms' }}
      />
      <div
        className={cn(
          'rounded-full animate-bounce',
          dotSizeClasses[size],
          dotVariantClasses[variant]
        )}
        style={{ animationDelay: '300ms' }}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingPulseProps {
  className?: string
}

export function LoadingPulse({ className }: LoadingPulseProps) {
  return (
    <div className={cn('flex items-center gap-2', className)} role="status" aria-label="Loading">
      <div className="h-2 w-2 bg-rausch-500 rounded-full animate-pulse" />
      <div className="h-2 w-2 bg-rausch-500 rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
      <div className="h-2 w-2 bg-rausch-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingBarProps {
  className?: string
}

export function LoadingBar({ className }: LoadingBarProps) {
  return (
    <div className={cn('w-full h-1 bg-gray-200 rounded-full overflow-hidden', className)} role="status" aria-label="Loading">
      <div className="h-full bg-gradient-to-r from-rausch-500 to-rausch-600 animate-loading-bar" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingSkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export function LoadingSkeleton({ className, variant = 'rectangular' }: LoadingSkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]',
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-airbnb-background-secondary flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-body-large text-airbnb-gray">{message}</p>
      </div>
    </div>
  )
}

interface CardLoadingProps {
  count?: number
  className?: string
}

export function CardLoading({ count = 3, className }: CardLoadingProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-elevated overflow-hidden">
          <LoadingSkeleton className="h-48 w-full rounded-t-lg rounded-b-none" />
          <div className="p-4 space-y-3">
            <LoadingSkeleton className="h-6 w-3/4" variant="text" />
            <LoadingSkeleton className="h-4 w-1/2" variant="text" />
            <div className="flex gap-2">
              <LoadingSkeleton className="h-4 w-16" variant="text" />
              <LoadingSkeleton className="h-4 w-16" variant="text" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface ButtonLoadingProps {
  children: React.ReactNode
  isLoading?: boolean
  loadingText?: string
  className?: string
}

export function ButtonLoading({ 
  children, 
  isLoading, 
  loadingText,
  className 
}: ButtonLoadingProps) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      {isLoading && <LoadingSpinner size="sm" variant="white" />}
      {isLoading && loadingText ? loadingText : children}
    </span>
  )
}

