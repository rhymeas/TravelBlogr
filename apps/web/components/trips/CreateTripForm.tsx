'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Calendar, MapPin, Users, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const createTripSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

type CreateTripFormData = z.infer<typeof createTripSchema>

interface CreateTripFormProps {
  onSuccess?: (trip: any) => void
  onCancel?: () => void
}

export function CreateTripForm({ onSuccess, onCancel }: CreateTripFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateTripFormData>({
    resolver: zodResolver(createTripSchema)
  })

  const onSubmit = async (data: CreateTripFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create trip')
      }

      const result = await response.json()
      
      toast.success('Trip created successfully!')
      reset()
      
      if (onSuccess) {
        onSuccess(result.trip)
      } else {
        router.push(`/dashboard/trips/${result.trip.id}`)
      }
      
    } catch (error) {
      console.error('Error creating trip:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create trip')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          Create New Trip
        </CardTitle>
        <CardDescription>
          Start documenting your journey and share it with different audiences
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Trip Title *
            </label>
            <Input
              id="title"
              placeholder="e.g., Summer Adventure in Japan"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Tell us about your trip..."
              {...register('description')}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Start Date
              </label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                End Date
              </label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                className={errors.endDate ? 'border-red-500' : ''}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Audience-Specific Sharing</h4>
                <p className="text-sm text-blue-700 mt-1">
                  After creating your trip, you'll get unique share links for family, friends, 
                  and professional networks - each showing different content and privacy levels.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Trip...
                </>
              ) : (
                'Create Trip'
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
