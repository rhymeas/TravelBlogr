import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { nanoid } from 'nanoid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate unique IDs
export const generateId = (prefix?: string) => {
  const id = nanoid(12)
  return prefix ? `${prefix}_${id}` : id
}

// Generate share link token
export const generateShareToken = () => nanoid(32)

// Format dates
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(
    typeof date === 'string' ? new Date(date) : date
  )
}

export const formatRelativeTime = (date: string | Date) => {
  const now = new Date()
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(targetDate)
}

// URL utilities
export const createSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export const createShareUrl = (token: string, type: string = 'trip') => {
  return `${getBaseUrl()}/share/${type}/${token}`
}

// File utilities
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileExtension = (filename: string) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export const isImageFile = (file: File | string) => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  
  if (typeof file === 'string') {
    const ext = getFileExtension(file).toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  }
  
  return imageTypes.includes(file.type)
}

export const isVideoFile = (file: File | string) => {
  const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
  
  if (typeof file === 'string') {
    const ext = getFileExtension(file).toLowerCase()
    return ['mp4', 'webm', 'ogg', 'mov'].includes(ext)
  }
  
  return videoTypes.includes(file.type)
}

// Location utilities
export const formatLocation = (location: { city?: string; country?: string; address?: string }) => {
  const parts = []
  if (location.city) parts.push(location.city)
  if (location.country) parts.push(location.country)
  return parts.join(', ') || location.address || 'Unknown location'
}

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in kilometers
}

// Validation utilities
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Text utilities
export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export const extractTextFromHtml = (html: string) => {
  if (typeof window === 'undefined') {
    // Server-side: simple regex approach
    return html.replace(/<[^>]*>/g, '').trim()
  }
  
  // Client-side: use DOM parser
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

// Color utilities
export const generateAvatarColor = (text: string) => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ]
  
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Local storage utilities
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export const setToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Handle storage errors silently
  }
}

export const removeFromStorage = (key: string): void => {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Handle storage errors silently
  }
}
