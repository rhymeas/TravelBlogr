/**
 * Domain Value Object: RouteInfo
 * Represents route information between two locations
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface StopLocation {
  id: string
  name: string
  slug: string
  coordinates: Coordinates
  detourKm: number
  rating?: number
}

export class RouteInfo {
  constructor(
    public readonly fromLocation: string,
    public readonly toLocation: string,
    public readonly distanceKm: number,
    public readonly estimatedDurationHours: number,
    public readonly stops: StopLocation[]
  ) {
    this.validate()
  }

  private validate(): void {
    if (this.distanceKm < 0) {
      throw new Error('Distance cannot be negative')
    }
    if (this.estimatedDurationHours < 0) {
      throw new Error('Duration cannot be negative')
    }
  }

  /**
   * Check if route requires travel day (> 200km)
   */
  requiresTravelDay(): boolean {
    return this.distanceKm > 200
  }

  /**
   * Calculate number of travel days needed
   */
  calculateTravelDays(): number {
    if (this.distanceKm < 200) return 0
    return Math.ceil(this.distanceKm / 300) // 300km per day
  }

  /**
   * Get formatted distance
   */
  getFormattedDistance(): string {
    return `${Math.round(this.distanceKm)} km`
  }

  /**
   * Get formatted duration
   */
  getFormattedDuration(): string {
    const hours = Math.floor(this.estimatedDurationHours)
    const minutes = Math.round((this.estimatedDurationHours - hours) * 60)
    return `${hours}h ${minutes}m`
  }
}

