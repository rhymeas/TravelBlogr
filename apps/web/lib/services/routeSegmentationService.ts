/**
 * Route Segmentation Service
 * 
 * Breaks routes into daily segments based on driving time limits.
 * This enables better trip pacing and POI discovery per day.
 * 
 * Use cases:
 * - Split long routes into manageable daily drives
 * - Suggest overnight stops
 * - Group POIs by day
 * - Calculate realistic arrival times
 */

export interface RouteSegment {
  day: number
  startLocation: {
    coordinates: [number, number]
    name: string
    arrivalTime?: string
  }
  endLocation: {
    coordinates: [number, number]
    name: string
    arrivalTime?: string
  }
  geometry: number[][] // Segment geometry [[lng, lat], ...]
  drivingTimeHours: number
  distanceKm: number
  estimatedDepartureTime: string
  estimatedArrivalTime: string
}

export interface OvernightStop {
  location: {
    coordinates: [number, number]
    name: string
  }
  day: number
  arrivalTime: string
  departureTime: string // Next day
  stayDuration: string // "1 night"
}

export interface SegmentationParams {
  routeGeometry: number[][] // Full route geometry
  totalDistanceKm: number
  totalDurationHours: number
  maxDrivingHoursPerDay: number // e.g., 4-6 hours
  startDate: string // ISO date
  startTime?: string // e.g., "09:00" (default: 09:00)
  locations: Array<{
    name: string
    coordinates: [number, number]
  }>
}

/**
 * Segment a route into daily driving segments
 * 
 * Algorithm:
 * 1. Calculate cumulative distance/time along route
 * 2. Split at maxDrivingHoursPerDay intervals
 * 3. Extract geometry for each segment
 * 4. Calculate departure/arrival times
 */
export function segmentRouteByDrivingTime(
  params: SegmentationParams
): RouteSegment[] {
  const {
    routeGeometry,
    totalDistanceKm,
    totalDurationHours,
    maxDrivingHoursPerDay,
    startDate,
    startTime = '09:00',
    locations
  } = params

  // If route is shorter than max daily driving, return single segment
  if (totalDurationHours <= maxDrivingHoursPerDay) {
    return [
      {
        day: 1,
        startLocation: {
          coordinates: locations[0].coordinates,
          name: locations[0].name
        },
        endLocation: {
          coordinates: locations[locations.length - 1].coordinates,
          name: locations[locations.length - 1].name
        },
        geometry: routeGeometry,
        drivingTimeHours: totalDurationHours,
        distanceKm: totalDistanceKm,
        estimatedDepartureTime: `${startDate}T${startTime}:00`,
        estimatedArrivalTime: calculateArrivalTime(startDate, startTime, totalDurationHours)
      }
    ]
  }

  // Calculate segments
  const segments: RouteSegment[] = []
  const numSegments = Math.ceil(totalDurationHours / maxDrivingHoursPerDay)
  const avgSegmentDuration = totalDurationHours / numSegments
  
  let currentDay = 1
  let currentDate = startDate
  let currentTime = startTime
  let accumulatedDistance = 0
  let accumulatedTime = 0
  let segmentStartIndex = 0

  // Calculate cumulative distances along route
  const cumulativeDistances = calculateCumulativeDistances(routeGeometry)
  const totalRouteDistance = cumulativeDistances[cumulativeDistances.length - 1]

  for (let i = 0; i < numSegments; i++) {
    const isLastSegment = i === numSegments - 1
    const targetTime = isLastSegment 
      ? totalDurationHours 
      : (i + 1) * avgSegmentDuration

    // Find geometry index closest to target time
    const targetDistance = (targetTime / totalDurationHours) * totalRouteDistance
    const segmentEndIndex = isLastSegment 
      ? routeGeometry.length - 1
      : findClosestIndex(cumulativeDistances, targetDistance)

    // Extract segment geometry
    const segmentGeometry = routeGeometry.slice(segmentStartIndex, segmentEndIndex + 1)

    // Calculate segment distance and duration
    const segmentStartDistance = segmentStartIndex > 0 ? cumulativeDistances[segmentStartIndex] : 0
    const segmentEndDistance = cumulativeDistances[segmentEndIndex]
    const segmentDistance = segmentEndDistance - segmentStartDistance
    const segmentDuration = (segmentDistance / totalRouteDistance) * totalDurationHours

    // Determine start/end locations
    const startLoc = i === 0 
      ? locations[0] 
      : { name: `Stop ${i}`, coordinates: routeGeometry[segmentStartIndex] as [number, number] }
    
    const endLoc = isLastSegment 
      ? locations[locations.length - 1]
      : { name: `Stop ${i + 1}`, coordinates: routeGeometry[segmentEndIndex] as [number, number] }

    // Calculate times
    const departureTime = `${currentDate}T${currentTime}:00`
    const arrivalTime = calculateArrivalTime(currentDate, currentTime, segmentDuration)

    segments.push({
      day: currentDay,
      startLocation: {
        coordinates: startLoc.coordinates,
        name: startLoc.name
      },
      endLocation: {
        coordinates: endLoc.coordinates,
        name: endLoc.name
      },
      geometry: segmentGeometry,
      drivingTimeHours: segmentDuration,
      distanceKm: segmentDistance,
      estimatedDepartureTime: departureTime,
      estimatedArrivalTime: arrivalTime
    })

    // Update for next segment
    segmentStartIndex = segmentEndIndex
    accumulatedDistance += segmentDistance
    accumulatedTime += segmentDuration
    
    // Next day starts at 09:00
    if (!isLastSegment) {
      currentDay++
      currentDate = addDays(currentDate, 1)
      currentTime = '09:00'
    }
  }

  return segments
}

/**
 * Calculate overnight stops from segments
 */
export function calculateOvernightStops(
  segments: RouteSegment[]
): OvernightStop[] {
  if (segments.length <= 1) return []

  const stops: OvernightStop[] = []

  for (let i = 0; i < segments.length - 1; i++) {
    const currentSegment = segments[i]
    const nextSegment = segments[i + 1]

    stops.push({
      location: {
        coordinates: currentSegment.endLocation.coordinates,
        name: currentSegment.endLocation.name
      },
      day: currentSegment.day,
      arrivalTime: currentSegment.estimatedArrivalTime,
      departureTime: nextSegment.estimatedDepartureTime,
      stayDuration: '1 night'
    })
  }

  return stops
}

/**
 * Calculate cumulative distances along route geometry
 */
function calculateCumulativeDistances(geometry: number[][]): number[] {
  const distances: number[] = [0]
  
  for (let i = 1; i < geometry.length; i++) {
    const [lng1, lat1] = geometry[i - 1]
    const [lng2, lat2] = geometry[i]
    const segmentDistance = haversineDistance(lat1, lng1, lat2, lng2)
    distances.push(distances[i - 1] + segmentDistance)
  }
  
  return distances
}

/**
 * Find index in cumulative distances closest to target distance
 */
function findClosestIndex(cumulativeDistances: number[], targetDistance: number): number {
  let closestIndex = 0
  let minDiff = Math.abs(cumulativeDistances[0] - targetDistance)
  
  for (let i = 1; i < cumulativeDistances.length; i++) {
    const diff = Math.abs(cumulativeDistances[i] - targetDistance)
    if (diff < minDiff) {
      minDiff = diff
      closestIndex = i
    }
  }
  
  return closestIndex
}

/**
 * Calculate arrival time given start date, start time, and duration
 */
function calculateArrivalTime(
  startDate: string,
  startTime: string,
  durationHours: number
): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const startDateTime = new Date(startDate)
  startDateTime.setHours(hours, minutes, 0, 0)
  
  const arrivalDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000)
  
  return arrivalDateTime.toISOString()
}

/**
 * Add days to a date string
 */
function addDays(dateString: string, days: number): string {
  const date = new Date(dateString)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

