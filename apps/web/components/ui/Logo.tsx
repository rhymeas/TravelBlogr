import Link from 'next/link'
import { Globe } from 'lucide-react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'light' | 'dark'
  showText?: boolean
  className?: string
}

export function Logo({ 
  size = 'medium', 
  variant = 'light', 
  showText = true,
  className = '' 
}: LogoProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12'
  }

  const iconSizes = {
    small: 'h-3 w-3',
    medium: 'h-5 w-5',
    large: 'h-7 w-7'
  }

  const textSizes = {
    small: 'text-body-medium',
    medium: 'text-title-medium', 
    large: 'text-display-small'
  }

  const textColors = {
    light: 'text-airbnb-black',
    dark: 'text-white'
  }

  return (
    <Link href="/" className={`flex items-center gap-3 hover:opacity-80 transition-opacity ${className}`}>
      {/* Logo Icon - Left side of trim sheet */}
      <div className={`${sizeClasses[size]} bg-rausch-500 rounded-airbnb-small flex items-center justify-center flex-shrink-0`}>
        <Globe className={`${iconSizes[size]} text-white`} />
      </div>
      
      {/* Brand Text - Right side of trim sheet */}
      {showText && (
        <span className={`${textSizes[size]} ${textColors[variant]} font-semibold`}>
          TravelBlogr
        </span>
      )}
    </Link>
  )
}

// Specific variants for common use cases
export function HeaderLogo({ className }: { className?: string }) {
  return <Logo size="medium" variant="light" showText={true} className={className} />
}

export function FooterLogo({ className }: { className?: string }) {
  return <Logo size="medium" variant="dark" showText={true} className={className} />
}

export function CompactLogo({ className }: { className?: string }) {
  return <Logo size="small" variant="light" showText={false} className={className} />
}
