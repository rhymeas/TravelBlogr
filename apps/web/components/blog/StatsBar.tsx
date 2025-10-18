'use client'

/**
 * StatsBar - Display statistics in a horizontal bar
 * Shows metrics like trip count, destinations, travelers
 * Uses existing design tokens and icon system
 */

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Stat {
  label: string
  value: string | number
  icon?: LucideIcon
  suffix?: string
  color?: 'default' | 'rausch' | 'green' | 'blue' | 'orange'
}

interface StatsBarProps {
  stats: Stat[]
  variant?: 'default' | 'compact' | 'large'
  layout?: 'horizontal' | 'grid'
  className?: string
}

export function StatsBar({
  stats,
  variant = 'default',
  layout = 'horizontal',
  className
}: StatsBarProps) {
  const variantClasses = {
    default: 'gap-8',
    compact: 'gap-4',
    large: 'gap-12'
  }

  const layoutClasses = {
    horizontal: 'flex flex-wrap justify-center items-center',
    grid: 'grid grid-cols-2 md:grid-cols-4'
  }

  return (
    <div className={cn(
      layoutClasses[layout],
      variantClasses[variant],
      className
    )}>
      {stats.map((stat, index) => (
        <StatItem
          key={index}
          stat={stat}
          variant={variant}
          showDivider={layout === 'horizontal' && index < stats.length - 1}
        />
      ))}
    </div>
  )
}

/**
 * StatItem - Individual statistic display
 */
interface StatItemProps {
  stat: Stat
  variant: 'default' | 'compact' | 'large'
  showDivider?: boolean
}

function StatItem({ stat, variant, showDivider }: StatItemProps) {
  const Icon = stat.icon

  const colorClasses = {
    default: 'text-gray-900',
    rausch: 'text-rausch-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    orange: 'text-orange-500'
  }

  const sizeClasses = {
    compact: {
      value: 'text-2xl',
      label: 'text-xs',
      icon: 'h-4 w-4'
    },
    default: {
      value: 'text-3xl md:text-4xl',
      label: 'text-sm',
      icon: 'h-5 w-5'
    },
    large: {
      value: 'text-4xl md:text-5xl',
      label: 'text-base',
      icon: 'h-6 w-6'
    }
  }

  return (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center text-center space-y-1">
        {Icon && (
          <Icon className={cn(
            sizeClasses[variant].icon,
            colorClasses[stat.color || 'default']
          )} />
        )}
        <div className={cn(
          'font-bold',
          sizeClasses[variant].value,
          colorClasses[stat.color || 'default']
        )}>
          {stat.value}{stat.suffix}
        </div>
        <div className={cn(
          'text-gray-600 font-medium',
          sizeClasses[variant].label
        )}>
          {stat.label}
        </div>
      </div>
      {showDivider && (
        <div className="hidden md:block h-12 w-px bg-gray-300" />
      )}
    </div>
  )
}

/**
 * StatsGrid - Alternative grid layout for stats
 */
interface StatsGridProps {
  stats: Stat[]
  columns?: 2 | 3 | 4
  className?: string
}

export function StatsGrid({
  stats,
  columns = 4,
  className
}: StatsGridProps) {
  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4'
  }

  return (
    <div className={cn(
      'grid gap-6',
      columnClasses[columns],
      className
    )}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            {stat.icon && (
              <stat.icon className={cn(
                'h-8 w-8',
                stat.color === 'rausch' ? 'text-rausch-500' :
                stat.color === 'green' ? 'text-green-500' :
                stat.color === 'blue' ? 'text-blue-500' :
                stat.color === 'orange' ? 'text-orange-500' :
                'text-gray-900'
              )} />
            )}
            <div className="text-3xl font-bold text-gray-900">
              {stat.value}{stat.suffix}
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * AnimatedStat - Stat with count-up animation
 */
interface AnimatedStatProps {
  stat: Stat
  duration?: number
}

export function AnimatedStat({ stat, duration = 2000 }: AnimatedStatProps) {
  // Note: Animation would require useEffect and state
  // For now, just display the value
  // Can be enhanced later with framer-motion or custom animation
  
  const Icon = stat.icon

  return (
    <div className="flex flex-col items-center text-center space-y-2">
      {Icon && (
        <Icon className="h-6 w-6 text-rausch-500" />
      )}
      <div className="text-4xl font-bold text-gray-900">
        {stat.value}{stat.suffix}
      </div>
      <div className="text-sm text-gray-600 font-medium">
        {stat.label}
      </div>
    </div>
  )
}

