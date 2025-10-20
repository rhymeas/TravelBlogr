"use client"
import * as React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  className?: string
  children?: React.ReactNode
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg'
}

export function Avatar({
  src,
  alt = '',
  size = 'md',
  fallback,
  className,
  children
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const showFallback = !src || imageError

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden bg-gray-200',
        sizeClasses[size],
        className
      )}
      data-avatar
    >
      {!showFallback && src ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : fallback ? (
        <span className="font-semibold text-gray-600 uppercase">
          {fallback}
        </span>
      ) : children ? (
        children
      ) : (
        <span className="font-semibold text-gray-600">?</span>
      )}
    </div>
  )
}

export function AvatarImage({ src, alt, className }: any) {
  return <img src={src || ''} alt={alt || ''} className={className} />
}

export function AvatarFallback({ children, className }: any) {
  return <div className={className}>{children}</div>
}

