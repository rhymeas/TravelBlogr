'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Calendar, MapPin, Clock, Plus, X, DragHandleDots2Icon, Plane, Car, Train, Ship } from 'lucide-react'
import { createClientSupabase } from '@/lib/supabase'
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { format, addDays, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'

interface planItem {
  id: string
  day: number
  time: string
  title: string
  description?: string
  location?: string
  type: 'activity' | 'accommodation' | 'transport' | 'meal' | 'other'
  duration?: number
  cost?: number
  notes?: string
  completed?: boolean
}

interface TripPlannerProps {
  tripId: string
  userId: string
  startDate?: string
  endDate?: string
  className?: string
}

export function TripPlanner({
  tripId,
  userId,
  startDate,
  endDate,
  className = ''
}: TripPlannerProps) {
  const [plan, setplan] = useState<planItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState<Partial<planItem>>({
    type: 'activity',
    time: '09:00'
  })

  const supabase = createClientSupabase()

  const tripDays = startDate && endDate 
    ? differenceInDays(new Date(endDate), new Date(startDate)) + 1
    : 7

  useEffect(() => {
    loadplan()
  }, [tripId])

  const loadplan = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('trip_plan')
        .select('*')
        .eq('trip_id', tripId)
        .order('day', { ascending: true })
        .order('time', { ascending: true })

      if (error) throw error

      setplan(data || [])
    } catch (error) {
      console.error('Error loading plan:', error)
      toast.error('Failed to load plan')
    } finally {
      setLoading(false)
    }
  }

  const saveplan = async () => {
    try {
      setSaving(true)

      // Delete existing items
      await supabase
        .from('trip_plan')
        .delete()
        .eq('trip_id', tripId)

      // Insert updated items
      if (plan.length > 0) {
        const { error } = await supabase
          .from('trip_plan')
          .insert(
            plan.map(item => ({
              ...item,
              trip_id: tripId,
              user_id: userId
            }))
          )

        if (error) throw error
      }

      toast.success('plan saved successfully')
    } catch (error) {
      console.error('Error saving plan:', error)
      toast.error('Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  const addItem = () => {
    if (!newItem.title) {
      toast.error('Please enter a title')
      return
    }

    const item: planItem = {
      id: `item-${Date.now()}`,
      day: selectedDay,
      time: newItem.time || '09:00',
      title: newItem.title,
      description: newItem.description,
      location: newItem.location,
      type: newItem.type || 'activity',
      duration: newItem.duration,
      cost: newItem.cost,
      notes: newItem.notes,
      completed: false
    }

    setplan(prev => [...prev, item].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day
      return a.time.localeCompare(b.time)
    }))

    setNewItem({ type: 'activity', time: '09:00' })
    setShowAddForm(false)
  }

  const removeItem = (id: string) => {
    setplan(prev => prev.filter(item => item.id !== id))
  }

  const toggleCompleted = (id: string) => {
    setplan(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(plan)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setplan(items)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transport':
        return <Car className="h-4 w-4" />
      case 'accommodation':
        return <MapPin className="h-4 w-4" />
      case 'meal':
        return <span className="text-sm">🍽️</span>
      case 'activity':
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transport':
        return 'bg-blue-100 text-blue-800'
      case 'accommodation':
        return 'bg-green-100 text-green-800'
      case 'meal':
        return 'bg-orange-100 text-orange-800'
      case 'activity':
      default:
        return 'bg-purple-100 text-purple-800'
    }
  }

  const dayItems = plan.filter(item => item.day === selectedDay)

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trip Planner</h2>
          <p className="text-gray-600">Plan your daily plan and activities</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
          
          <Button
            onClick={saveplan}
            disabled={saving}
            variant="outline"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: tripDays }, (_, i) => i + 1).map(day => {
          const date = startDate ? addDays(new Date(startDate), day - 1) : null
          const dayItems = plan.filter(item => item.day === day)
          
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 p-3 rounded-lg border text-center min-w-[80px] ${
                selectedDay === day
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold">Day {day}</div>
              {date && (
                <div className="text-xs opacity-75">
                  {format(date, 'MMM d')}
                </div>
              )}
              {dayItems.length > 0 && (
                <div className="text-xs mt-1">
                  {dayItems.length} item{dayItems.length !== 1 ? 's' : ''}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Add New Activity</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={newItem.title || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Activity title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select
                  value={newItem.type}
                  onValueChange={(value: any) => setNewItem(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="accommodation">Accommodation</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="meal">Meal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <Input
                  type="time"
                  value={newItem.time || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <Input
                  value={newItem.location || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Location (optional)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Activity description (optional)"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={addItem}>Add Activity</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* plan Items */}
      <div className="space-y-4">
        {dayItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities planned</h3>
            <p className="text-gray-600 mb-4">Add your first activity for Day {selectedDay}</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="plan">
              {(provided: DroppableProvided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {dayItems.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-4 ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          } ${
                            item.completed ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab"
                            >
                              <DragHandleDots2Icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge className={`flex items-center gap-1 ${getTypeColor(item.type)}`}>
                                    {getTypeIcon(item.type)}
                                    {item.type}
                                  </Badge>
                                  <span className="text-sm text-gray-600">{item.time}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleCompleted(item.id)}
                                    className={item.completed ? 'text-green-600' : 'text-gray-400'}
                                  >
                                    ✓
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(item.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <h4 className={`font-semibold mb-1 ${item.completed ? 'line-through' : ''}`}>
                                {item.title}
                              </h4>
                              
                              {item.location && (
                                <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                  <MapPin className="h-3 w-3" />
                                  {item.location}
                                </div>
                              )}
                              
                              {item.description && (
                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {item.duration && (
                                  <span>{item.duration} hours</span>
                                )}
                                {item.cost && (
                                  <span>${item.cost}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  )
}
