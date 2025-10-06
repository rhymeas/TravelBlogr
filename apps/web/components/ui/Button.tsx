import * as React from 'react'
import { cn } from '@/lib/utils'

// Simplified Button component without external dependencies
const buttonVariants = {
  variant: {
    default: 'bg-rausch-500 text-white hover:bg-rausch-600 shadow-md hover:shadow-lg',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm hover:shadow-md',
    ghost: 'hover:bg-gray-100 hover:text-gray-900',
    link: 'text-rausch-500 underline-offset-4 hover:underline',
  },
  size: {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  },
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const baseClasses = 'group inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rausch-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
    const variantClasses = buttonVariants.variant[variant]
    const sizeClasses = buttonVariants.size[size]

    if (asChild) {
      // For now, just render as button since we don't have Slot
      return (
        <button
          className={cn(baseClasses, variantClasses, sizeClasses, className)}
          ref={ref}
          {...props}
        />
      )
    }

    return (
      <button
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
