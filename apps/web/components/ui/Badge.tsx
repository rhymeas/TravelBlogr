import * as React from 'react'
import { cn } from '@/lib/utils'

// Simplified Badge component without class-variance-authority
const badgeVariants = {
  default: 'border-transparent bg-rausch-500 text-white hover:bg-rausch-600',
  secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
  destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
  outline: 'text-gray-900 border-gray-300',
}

export interface BadgeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'popover'> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-rausch-500 focus:ring-offset-2',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
