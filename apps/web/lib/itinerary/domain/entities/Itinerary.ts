/**
 * Domain Entity: Itinerary
 * Represents a complete travel itinerary
 */

export interface ItineraryItem {
  time: string
  title: string
  type: 'activity' | 'meal' | 'travel'
  duration: number // hours
  description: string
  costEstimate?: number
  location?: {
    name: string
    address?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
}

export interface ItineraryDay {
  day: number
  date: string
  location: string
  type: 'stay' | 'travel'
  items: ItineraryItem[]
  travelInfo?: {
    from: string
    to: string
    distance: number
    duration: number
    mode: string
  }
}

export class Itinerary {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly summary: string,
    public readonly days: ItineraryDay[],
    public readonly totalCostEstimate: number,
    public readonly tips: string[],
    public readonly createdAt: Date = new Date()
  ) {
    this.validate()
  }

  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Itinerary title is required')
    }
    if (this.days.length === 0) {
      throw new Error('Itinerary must have at least one day')
    }
    if (this.totalCostEstimate < 0) {
      throw new Error('Total cost cannot be negative')
    }
  }

  /**
   * Get total number of days
   */
  getTotalDays(): number {
    return this.days.length
  }

  /**
   * Get number of stay days (excluding travel days)
   */
  getStayDays(): number {
    return this.days.filter(d => d.type === 'stay').length
  }

  /**
   * Get number of travel days
   */
  getTravelDays(): number {
    return this.days.filter(d => d.type === 'travel').length
  }

  /**
   * Get all unique locations visited
   */
  getLocations(): string[] {
    const locations = new Set<string>()
    this.days.forEach(day => {
      if (day.type === 'stay') {
        locations.add(day.location)
      }
    })
    return Array.from(locations)
  }

  /**
   * Get total number of activities
   */
  getTotalActivities(): number {
    return this.days.reduce((total, day) => {
      if (!day.items || !Array.isArray(day.items)) {
        console.warn(`Day ${day.day} has invalid items:`, day.items)
        return total
      }
      return total + day.items.filter(item => item.type === 'activity').length
    }, 0)
  }

  /**
   * Get total number of meals
   */
  getTotalMeals(): number {
    return this.days.reduce((total, day) => {
      if (!day.items || !Array.isArray(day.items)) {
        console.warn(`Day ${day.day} has invalid items:`, day.items)
        return total
      }
      return total + day.items.filter(item => item.type === 'meal').length
    }, 0)
  }

  /**
   * Get average cost per day
   */
  getAverageCostPerDay(): number {
    const actualTotal = this.getActualTotalCost()
    return actualTotal / this.days.length
  }

  /**
   * Calculate actual total cost from all items
   */
  getActualTotalCost(): number {
    return this.days.reduce((total, day) => {
      if (!day.items || !Array.isArray(day.items)) return total
      return total + day.items.reduce((dayTotal, item) => {
        return dayTotal + (item.costEstimate || 0)
      }, 0)
    }, 0)
  }

  /**
   * Convert to JSON for API response
   */
  toJSON() {
    const actualTotalCost = this.getActualTotalCost()

    return {
      id: this.id,
      title: this.title,
      summary: this.summary,
      days: this.days,
      totalCostEstimate: actualTotalCost, // Use calculated cost instead of AI estimate
      tips: this.tips,
      stats: {
        totalDays: this.getTotalDays(),
        stayDays: this.getStayDays(),
        travelDays: this.getTravelDays(),
        locations: this.getLocations(),
        totalActivities: this.getTotalActivities(),
        totalMeals: this.getTotalMeals(),
        averageCostPerDay: Math.round(actualTotalCost / this.days.length)
      },
      createdAt: this.createdAt.toISOString()
    }
  }

  /**
   * Create from raw data (factory method)
   */
  static create(data: {
    title: string
    summary: string
    days: ItineraryDay[]
    totalCostEstimate: number
    tips: string[]
  }): Itinerary {
    return new Itinerary(
      crypto.randomUUID(),
      data.title,
      data.summary,
      data.days,
      data.totalCostEstimate,
      data.tips
    )
  }
}

