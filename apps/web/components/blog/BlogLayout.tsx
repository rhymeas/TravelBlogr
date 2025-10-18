'use client'

/**
 * BlogLayout - Main container for blog pages
 * Provides consistent layout structure for all blog content
 * Uses existing design system - no custom CSS
 */

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BlogLayoutProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  variant?: 'default' | 'centered' | 'wide'
}

export function BlogLayout({
  children,
  className,
  maxWidth = 'xl',
  variant = 'default'
}: BlogLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  const variantClasses = {
    default: 'px-4 sm:px-6 lg:px-8',
    centered: 'px-4 sm:px-6 lg:px-8 mx-auto text-center',
    wide: 'px-4 sm:px-6 lg:px-12'
  }

  return (
    <div className={cn(
      'w-full',
      maxWidthClasses[maxWidth],
      variantClasses[variant],
      className
    )}>
      {children}
    </div>
  )
}

/**
 * BlogSection - Reusable section wrapper with consistent spacing
 */
interface BlogSectionProps {
  children: ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  background?: 'white' | 'gray' | 'gradient'
}

export function BlogSection({
  children,
  className,
  spacing = 'lg',
  background = 'white'
}: BlogSectionProps) {
  const spacingClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24'
  }

  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    gradient: 'bg-gradient-to-b from-white to-gray-50'
  }

  return (
    <section className={cn(
      spacingClasses[spacing],
      backgroundClasses[background],
      className
    )}>
      {children}
    </section>
  )
}

/**
 * BlogGrid - Responsive grid layout for blog content
 */
interface BlogGridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BlogGrid({
  children,
  columns = 3,
  gap = 'md',
  className
}: BlogGridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  }

  return (
    <div className={cn(
      'grid',
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

/**
 * BlogContainer - Full-width container with background
 */
interface BlogContainerProps {
  children: ReactNode
  className?: string
  background?: 'white' | 'gray' | 'gradient' | 'rausch'
}

export function BlogContainer({
  children,
  className,
  background = 'white'
}: BlogContainerProps) {
  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    gradient: 'bg-gradient-to-r from-rausch-50 to-orange-50',
    rausch: 'bg-rausch-500 text-white'
  }

  return (
    <div className={cn(
      'w-full',
      backgroundClasses[background],
      className
    )}>
      {children}
    </div>
  )
}

