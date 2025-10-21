/**
 * Type definitions for Trip Planner V2
 */

export type TripType = 'specific' | 'journey' | 'multi-destination' | 'adventure' | 'bike'

export type TransportMode = 'car' | 'train' | 'bike' | 'flight' | 'bus' | 'mixed' | 'foot'

export type CompanionType = 'solo' | 'couple' | 'family' | 'friends' | 'business'

export type TravelPace = 'relaxed' | 'moderate' | 'active' | 'intensive'

export type BudgetRange = 'budget' | 'mid-range' | 'comfortable' | 'luxury' | 'no-constraint'

export type WaypointStrategy = 'direct' | 'suggested' | 'custom' | 'scenic'

export interface Destination {
  name: string
  type: 'start' | 'stop' | 'end'
  coordinates?: { lat: number; lng: number }
  latitude?: number
  longitude?: number
  region?: string
  country?: string
}

export interface DateRange {
  startDate: Date
  endDate: Date
  flexible: boolean
}

export interface TransportDetails {
  // Car/Road Trip
  hasVehicle?: boolean
  vehicleType?: string
  scenicRoutes?: boolean
  parkingPreference?: string
  
  // Train
  railPass?: boolean
  classPreference?: string
  scenicTrains?: boolean
  
  // Cycling
  bikeType?: string
  ownBike?: boolean
  supportedTour?: boolean
  dailyDistance?: number
  
  // Flight
  flightClass?: string
  directFlights?: boolean
  groundTransport?: string
  
  // Mixed
  primaryMode?: TransportMode
  secondaryModes?: TransportMode[]
}

export interface TripPlanData {
  // Phase 1: Journey Foundation
  destinations: Destination[]
  tripType: TripType | null
  dateRange: DateRange | null
  
  // Phase 2: Travel Companions
  companions: CompanionType | null
  groupSize: number
  specialNeeds: string[]
  childAges?: number[]
  
  // Phase 3: Transportation
  transportMode: TransportMode | null
  transportDetails: TransportDetails
  
  // Phase 4: Travel Style
  pace: TravelPace
  travelStyle: string[]
  dailyTravelHours?: number
  
  // Phase 5: Practical Details
  budget: BudgetRange
  budgetPerDay?: number
  currency?: string
  accommodationTypes: string[]
  accommodationLocation?: string
  diningPreference: string
  
  // Phase 6: Route Planning (conditional)
  waypointStrategy: WaypointStrategy | null
  stopPreferences: string[]
  stopDuration?: string
  flexibleScheduling: {
    mustSee?: string[]
    niceToHave?: string[]
    bufferTime?: boolean
    endTimePreference?: string
  }
}

export interface PhaseProps {
  data: TripPlanData
  updateData: (updates: Partial<TripPlanData>) => void
  onNext: () => void
  onBack?: () => void
}

