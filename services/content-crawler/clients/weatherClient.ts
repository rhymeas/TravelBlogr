/**
 * OpenWeatherMap API Client
 * Fetches real-time weather data for locations
 */

import axios from 'axios'
import type { WeatherData, WeatherForecast } from '../types'

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

interface OpenWeatherCurrentResponse {
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: {
    speed: number
    deg?: number
  }
  visibility?: number
  sys: {
    sunrise: number
    sunset: number
  }
  dt: number
}

interface OpenWeatherForecastResponse {
  list: Array<{
    dt: number
    main: {
      temp_min: number
      temp_max: number
      humidity: number
    }
    weather: Array<{
      main: string
      description: string
    }>
    wind: {
      speed: number
    }
    pop?: number // probability of precipitation
  }>
}

/**
 * Fetch current weather for a location
 */
export async function fetchCurrentWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  if (!OPENWEATHER_API_KEY) {
    console.error('OPENWEATHER_API_KEY is not set')
    return null
  }

  try {
    const response = await axios.get<OpenWeatherCurrentResponse>(
      `${OPENWEATHER_BASE_URL}/weather`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          appid: OPENWEATHER_API_KEY,
          units: 'metric', // Celsius
        },
        timeout: 10000,
      }
    )

    const data = response.data

    return {
      location_id: '', // Will be set by caller
      temperature: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      condition: data.weather[0]?.main || 'Unknown',
      description: data.weather[0]?.description || '',
      humidity: data.main.humidity,
      wind_speed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      wind_direction: data.wind.deg,
      pressure: data.main.pressure,
      visibility: data.visibility ? Math.round(data.visibility / 1000) : undefined, // Convert to km
      icon: data.weather[0]?.icon || '01d',
      sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
      sunset: new Date(data.sys.sunset * 1000).toISOString(),
      updated_at: new Date(data.dt * 1000).toISOString(),
    }
  } catch (error) {
    console.error('Error fetching weather data:', error)
    return null
  }
}

/**
 * Fetch 5-day weather forecast
 */
export async function fetchWeatherForecast(
  latitude: number,
  longitude: number
): Promise<WeatherForecast[]> {
  if (!OPENWEATHER_API_KEY) {
    console.error('OPENWEATHER_API_KEY is not set')
    return []
  }

  try {
    const response = await axios.get<OpenWeatherForecastResponse>(
      `${OPENWEATHER_BASE_URL}/forecast`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
          cnt: 40, // 5 days * 8 (3-hour intervals)
        },
        timeout: 10000,
      }
    )

    // Group by day and get min/max temps
    const dailyForecasts = new Map<string, WeatherForecast>()

    response.data.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0]

      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, {
          location_id: '', // Will be set by caller
          date,
          temp_min: item.main.temp_min,
          temp_max: item.main.temp_max,
          condition: item.weather[0]?.main || 'Unknown',
          description: item.weather[0]?.description || '',
          precipitation_chance: item.pop ? Math.round(item.pop * 100) : undefined,
          humidity: item.main.humidity,
          wind_speed: Math.round(item.wind.speed * 3.6),
        })
      } else {
        const existing = dailyForecasts.get(date)!
        existing.temp_min = Math.min(existing.temp_min, item.main.temp_min)
        existing.temp_max = Math.max(existing.temp_max, item.main.temp_max)
      }
    })

    return Array.from(dailyForecasts.values()).map((forecast) => ({
      ...forecast,
      temp_min: Math.round(forecast.temp_min),
      temp_max: Math.round(forecast.temp_max),
    }))
  } catch (error) {
    console.error('Error fetching weather forecast:', error)
    return []
  }
}

/**
 * Sync weather data for a location to Supabase
 */
export async function syncWeatherForLocation(
  locationId: string,
  latitude: number,
  longitude: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const weatherData = await fetchCurrentWeather(latitude, longitude)

    if (!weatherData) {
      return { success: false, error: 'Failed to fetch weather data' }
    }

    weatherData.location_id = locationId

    // Import Supabase client dynamically to avoid circular dependencies
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upsert weather data
    const { error } = await supabase
      .from('location_weather')
      .upsert(weatherData, {
        onConflict: 'location_id',
      })

    if (error) {
      console.error('Error saving weather data:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Weather synced for location: ${locationId}`)
    return { success: true }
  } catch (error) {
    console.error('Error syncing weather:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Sync weather for all locations in database
 */
export async function syncAllLocationsWeather(): Promise<{
  success: boolean
  processed: number
  errors: string[]
}> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch all locations with coordinates
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error) {
      console.error('Error fetching locations:', error)
      return { success: false, processed: 0, errors: [error.message] }
    }

    if (!locations || locations.length === 0) {
      console.log('No locations found with coordinates')
      return { success: true, processed: 0, errors: [] }
    }

    const errors: string[] = []
    let processed = 0

    // Process locations sequentially to respect rate limits
    for (const location of locations) {
      const result = await syncWeatherForLocation(
        location.id,
        location.latitude,
        location.longitude
      )

      if (result.success) {
        processed++
      } else {
        errors.push(`${location.name}: ${result.error}`)
      }

      // Rate limiting: wait 1 second between requests (free tier limit)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    console.log(`✅ Weather sync complete: ${processed}/${locations.length} locations`)

    return {
      success: errors.length === 0,
      processed,
      errors,
    }
  } catch (error) {
    console.error('Error syncing all weather:', error)
    return {
      success: false,
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

