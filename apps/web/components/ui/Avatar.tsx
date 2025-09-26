"use client"
import * as React from 'react'

// Minimal Avatar components to unblock build. Replace with a real Avatar later.
export function Avatar({ className, children }: any) {
  return <div className={className} data-avatar>{children}</div>
}

export function AvatarImage({ src, alt, className }: any) {
  return <img src={src || ''} alt={alt || ''} className={className} />
}

export function AvatarFallback({ children, className }: any) {
  return <div className={className}>{children}</div>
}

