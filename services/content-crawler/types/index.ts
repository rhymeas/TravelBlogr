/**
 * TypeScript types for Content Crawler
 */

// Restaurant Types
export interface RestaurantData {
  name: string
  description?: string
  cuisine: string | string[]
  price_range?: string
  rating?: number
  review_count?: number
  address?: string
  city?: string
  country?: string
  phone?: string
  website?: string
  menu_url?: string
  image_url?: string
  specialties?: string[]
  opening_hours?: OpeningHours[]
  latitude?: number
  longitude?: number
  source_url: string
  crawled_at: string
}

export interface OpeningHours {
  day: string
  open: string
  close: string
}

// Weather Types
export interface WeatherData {
  location_id: string
  temperature: number
  feels_like: number
  condition: string
  description: string
  humidity: number
  wind_speed: number
  wind_direction?: number
  pressure?: number
  visibility?: number
  icon: string
  sunrise?: string
  sunset?: string
  updated_at: string
}

export interface WeatherForecast {
  location_id: string
  date: string
  temp_min: number
  temp_max: number
  condition: string
  description: string
  precipitation_chance?: number
  humidity: number
  wind_speed: number
}

// Activity/Place Types
export interface ActivityData {
  name: string
  description: string
  category: string
  difficulty?: string
  duration?: string
  cost?: string
  best_time?: string
  booking_required?: boolean
  image_url?: string
  website?: string
  address?: string
  latitude?: number
  longitude?: number
  rating?: number
  review_count?: number
  source_url: string
  crawled_at: string
}

// Schema.org JSON-LD Types
export interface SchemaOrgRestaurant {
  '@context': string
  '@type': 'Restaurant' | 'FoodEstablishment'
  name: string
  description?: string
  servesCuisine?: string | string[]
  priceRange?: string
  address?: SchemaOrgAddress
  telephone?: string
  url?: string
  hasMenu?: string
  image?: string | string[]
  aggregateRating?: SchemaOrgRating
  openingHoursSpecification?: SchemaOrgOpeningHours[]
  geo?: SchemaOrgGeoCoordinates
}

export interface SchemaOrgAddress {
  '@type': 'PostalAddress'
  streetAddress?: string
  addressLocality?: string
  addressRegion?: string
  postalCode?: string
  addressCountry?: string
}

export interface SchemaOrgRating {
  '@type': 'AggregateRating'
  ratingValue: number
  reviewCount?: number
  bestRating?: number
  worstRating?: number
}

export interface SchemaOrgOpeningHours {
  '@type': 'OpeningHoursSpecification'
  dayOfWeek: string | string[]
  opens: string
  closes: string
}

export interface SchemaOrgGeoCoordinates {
  '@type': 'GeoCoordinates'
  latitude: number
  longitude: number
}

// Crawler Configuration
export interface CrawlerConfig {
  maxRequestsPerCrawl?: number
  maxConcurrency?: number
  requestTimeout?: number
  retryCount?: number
  userAgent?: string
  respectRobotsTxt?: boolean
  rateLimit?: number // requests per second
}

// Crawler Result
export interface CrawlerResult<T> {
  success: boolean
  data?: T[]
  errors?: CrawlerError[]
  stats: CrawlerStats
}

export interface CrawlerError {
  url: string
  error: string
  timestamp: string
}

export interface CrawlerStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  itemsExtracted: number
  duration: number // milliseconds
  startTime: string
  endTime: string
}

// Database Insert Types
export interface LocationRestaurantInsert {
  location_id: string
  name: string
  description?: string
  cuisine: string
  price_range?: string
  rating?: number
  review_count?: number
  address?: string
  phone?: string
  website?: string
  menu_url?: string
  image_url?: string
  specialties?: string[]
  latitude?: number
  longitude?: number
  source_url: string
  is_verified: boolean
  created_at?: string
  updated_at?: string
}

export interface LocationWeatherInsert {
  location_id: string
  temperature: number
  feels_like: number
  condition: string
  description: string
  humidity: number
  wind_speed: number
  wind_direction?: number
  pressure?: number
  visibility?: number
  icon: string
  sunrise?: string
  sunset?: string
  updated_at: string
}

export interface LocationActivityInsert {
  location_id: string
  name: string
  description: string
  category: string
  difficulty?: string
  duration?: string
  cost?: string
  best_time?: string
  booking_required?: boolean
  image_url?: string
  website?: string
  address?: string
  latitude?: number
  longitude?: number
  rating?: number
  source_url: string
  is_verified: boolean
  created_at?: string
  updated_at?: string
}

// API Response Types
export interface CrawlerAPIResponse {
  success: boolean
  message: string
  data?: any
  stats?: CrawlerStats
  errors?: CrawlerError[]
}

// Cron Job Types
export interface CronJobConfig {
  jobName: string
  schedule: string // cron expression
  enabled: boolean
  lastRun?: string
  nextRun?: string
}

export interface CronJobResult {
  jobName: string
  success: boolean
  startTime: string
  endTime: string
  duration: number
  itemsProcessed: number
  errors?: string[]
}

