import Link from 'next/link'

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
  const dimensions = {
    small: { width: 120, height: 24, iconSize: 20, fontSize: '16px' },
    medium: { width: 160, height: 32, iconSize: 28, fontSize: '22px' },
    large: { width: 200, height: 40, iconSize: 35, fontSize: '28px' }
  }

  const dim = dimensions[size]
  const color = '#2C5F6F' // Teal color from the logo

  return (
    <Link href="/" className={`flex items-center hover:opacity-80 transition-opacity ${className}`}>
      <svg
        width={dim.width}
        height={dim.height}
        viewBox="0 0 160 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Paper Plane Icon - Rotated 160 degrees */}
        <g transform="translate(14, 16) rotate(160) translate(-14, -12)">
          {/* Plane outline */}
          <path
            d="M2 22 L14 2 L26 22 L14 18 L2 22 Z"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner lines */}
          <path
            d="M14 2 L14 18 M14 18 L8 20"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* TravelBlogr Text */}
        <text
          x="34"
          y="23"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="18"
          fontWeight="700"
          fill={color}
          letterSpacing="-0.5"
        >
          TravelBlogr
        </text>
      </svg>
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
