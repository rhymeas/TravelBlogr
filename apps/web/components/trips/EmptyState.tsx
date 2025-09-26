import { ReactNode } from 'react'
import { MapPin, Compass } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ 
  title, 
  description, 
  action,
  icon = <Compass className="h-12 w-12 text-gray-400" />
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
