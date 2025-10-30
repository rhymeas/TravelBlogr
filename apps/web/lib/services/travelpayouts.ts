/**
 * Travelpayouts Affiliate Integration
 * 
 * Generates affiliate links for hotels, flights, cars, and activities
 * Documentation: https://www.travelpayouts.com/developers/api
 */

// Travelpayouts credentials
// You can override these in .env.local if needed:
// NEXT_PUBLIC_TRAVELPAYOUTS_MARKER=your_marker_id
// NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN=your_api_token

const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '470210'
const TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || ''

/**
 * Generate hotel search link (Booking.com via Travelpayouts)
 */
export function generateHotelLink(params: {
  city: string
  checkIn?: Date
  checkOut?: Date
  adults?: number
  children?: number
}): string {
  const { city, checkIn, checkOut, adults = 2, children = 0 } = params

  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  const baseUrl = 'https://search.hotellook.com'
  const queryParams = new URLSearchParams({
    marker: MARKER,
    language: 'en',
    currency: 'USD',
    destination: city,
    adults: adults.toString(),
    children: children.toString(),
    ...(checkIn && { checkIn: formatDate(checkIn) }),
    ...(checkOut && { checkOut: formatDate(checkOut) })
  })

  return `${baseUrl}?${queryParams.toString()}`
}

/**
 * Generate flight search link (Aviasales via Travelpayouts)
 */
export function generateFlightLink(params: {
  origin: string  // IATA code (e.g., 'PAR')
  destination: string  // IATA code (e.g., 'ROM')
  departDate?: Date
  returnDate?: Date
  adults?: number
  children?: number
  infants?: number
}): string {
  const { origin, destination, departDate, returnDate, adults = 1, children = 0, infants = 0 } = params

  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  const baseUrl = 'https://www.aviasales.com/search'
  const queryParams = new URLSearchParams({
    marker: MARKER,
    origin_iata: origin,
    destination_iata: destination,
    adults: adults.toString(),
    children: children.toString(),
    infants: infants.toString(),
    ...(departDate && { depart_date: formatDate(departDate) }),
    ...(returnDate && { return_date: formatDate(returnDate) })
  })

  return `${baseUrl}?${queryParams.toString()}`
}

/**
 * Generate car rental link (Rentalcars via Travelpayouts)
 */
export function generateCarRentalLink(params: {
  location: string
  pickupDate?: Date
  dropoffDate?: Date
  pickupTime?: string  // HH:MM format
  dropoffTime?: string  // HH:MM format
}): string {
  const { location, pickupDate, dropoffDate, pickupTime = '10:00', dropoffTime = '10:00' } = params

  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  const baseUrl = 'https://www.rentalcars.com/SearchResults.do'
  const queryParams = new URLSearchParams({
    affiliateCode: MARKER,
    location,
    ...(pickupDate && { 
      puDay: pickupDate.getDate().toString(),
      puMonth: (pickupDate.getMonth() + 1).toString(),
      puYear: pickupDate.getFullYear().toString(),
      puTime: pickupTime
    }),
    ...(dropoffDate && { 
      doDay: dropoffDate.getDate().toString(),
      doMonth: (dropoffDate.getMonth() + 1).toString(),
      doYear: dropoffDate.getFullYear().toString(),
      doTime: dropoffTime
    })
  })

  return `${baseUrl}?${queryParams.toString()}`
}

/**
 * Generate activity/tour link (GetYourGuide via Travelpayouts)
 */
export function generateActivityLink(params: {
  city: string
  query?: string
}): string {
  const { city, query } = params

  const baseUrl = 'https://www.getyourguide.com'
  const queryParams = new URLSearchParams({
    partner_id: MARKER,
    ...(query && { q: query })
  })

  return `${baseUrl}/s/${encodeURIComponent(city)}?${queryParams.toString()}`
}

/**
 * Generate Airbnb link (via Travelpayouts)
 */
export function generateAirbnbLink(params: {
  location: string
  checkIn?: Date
  checkOut?: Date
  adults?: number
  children?: number
}): string {
  const { location, checkIn, checkOut, adults = 2, children = 0 } = params

  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  const baseUrl = 'https://www.airbnb.com/s'
  const queryParams = new URLSearchParams({
    aid: MARKER,
    query: location,
    adults: adults.toString(),
    children: children.toString(),
    ...(checkIn && { checkin: formatDate(checkIn) }),
    ...(checkOut && { checkout: formatDate(checkOut) })
  })

  return `${baseUrl}?${queryParams.toString()}`
}

/**
 * Get city name from location string
 * "Paris, France" → "Paris"
 * "Lyon, Auvergne-Rhône-Alpes, France" → "Lyon"
 */
export function extractCityName(location: string): string {
  return location.split(',')[0].trim()
}

/**
 * Get IATA code from city name (simplified mapping)
 * In production, you'd use Travelpayouts API to get accurate codes
 */
export function getCityIATA(cityName: string): string {
  const iataMap: Record<string, string> = {
    'Paris': 'PAR',
    'Rome': 'ROM',
    'London': 'LON',
    'Barcelona': 'BCN',
    'Amsterdam': 'AMS',
    'Berlin': 'BER',
    'Madrid': 'MAD',
    'Vienna': 'VIE',
    'Prague': 'PRG',
    'Budapest': 'BUD',
    'Lyon': 'LYS',
    'Milan': 'MIL',
    'Venice': 'VCE',
    'Florence': 'FLR',
    'Munich': 'MUC',
    'Frankfurt': 'FRA',
    'Zurich': 'ZRH',
    'Geneva': 'GVA',
    'Brussels': 'BRU',
    'Copenhagen': 'CPH',
    'Stockholm': 'STO',
    'Oslo': 'OSL',
    'Helsinki': 'HEL',
    'Dublin': 'DUB',
    'Edinburgh': 'EDI',
    'Lisbon': 'LIS',
    'Porto': 'OPO',
    'Athens': 'ATH',
    'Istanbul': 'IST',
    'Warsaw': 'WAW',
    'Krakow': 'KRK',
    'New York': 'NYC',
    'Los Angeles': 'LAX',
    'San Francisco': 'SFO',
    'Chicago': 'CHI',
    'Miami': 'MIA',
    'Las Vegas': 'LAS',
    'Seattle': 'SEA',
    'Boston': 'BOS',
    'Washington': 'WAS',
    'Toronto': 'YTO',
    'Vancouver': 'YVR',
    'Montreal': 'YMQ',
    'Tokyo': 'TYO',
    'Osaka': 'OSA',
    'Seoul': 'SEL',
    'Singapore': 'SIN',
    'Hong Kong': 'HKG',
    'Bangkok': 'BKK',
    'Dubai': 'DXB',
    'Sydney': 'SYD',
    'Melbourne': 'MEL',
    'Auckland': 'AKL'
  }

  return iataMap[cityName] || cityName.substring(0, 3).toUpperCase()
}

/**
 * Calculate nights between two dates
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Check if Travelpayouts is configured
 */
export function isTravelpayoutsConfigured(): boolean {
  return !!MARKER && MARKER !== 'demo' && !!TOKEN
}

