/**
 * API Route: Get Weather Data for Location
 * GET /api/locations/[slug]/weather
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLocationBySlug } from '@/lib/supabase/locations'
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/upstash'

interface RouteParams {
  params: {
    slug: string
  }
}

// Fetch weather from external APIs
async function fetchWeatherData(locationName: string) {
  const apiKey = process.env.OPENWEATHER_API_KEY

  // Try OpenWeatherMap first (if API key configured)
  if (apiKey) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationName)}&appid=${apiKey}&units=metric`
      )

      if (response.ok) {
        const data = await response.json()
        return {
          temperature: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          condition: data.weather[0].main,
          description: data.weather[0].description,
          humidity: data.main.humidity,
          wind_speed: Math.round(data.wind.speed),
          icon: data.weather[0].icon,
          updated_at: new Date().toISOString(),
          source: 'openweather'
        }
      }
    } catch (error) {
      console.error('OpenWeather API error:', error)
    }
  }

  // Fallback: Use free weather API (wttr.in)
  try {
    const response = await fetch(
      `https://wttr.in/${encodeURIComponent(locationName)}?format=j1`
    )

    if (response.ok) {
      const data = await response.json()
      const current = data.current_condition[0]

      return {
        temperature: parseInt(current.temp_C),
        feels_like: parseInt(current.FeelsLikeC),
        condition: current.weatherDesc[0].value,
        description: current.weatherDesc[0].value,
        humidity: parseInt(current.humidity),
        wind_speed: parseInt(current.windspeedKmph),
        icon: current.weatherCode,
        updated_at: new Date().toISOString(),
        source: 'wttr.in'
      }
    }
  } catch (error) {
    console.error('wttr.in API error:', error)
  }

  // Final fallback: Return mock data
  console.warn('⚠️ Using mock weather data - no API available')
  return {
    temperature: 22,
    feels_like: 20,
    condition: 'Partly Cloudy',
    description: 'Partly cloudy',
    humidity: 65,
    wind_speed: 15,
    icon: '02d',
    updated_at: new Date().toISOString(),
    source: 'mock'
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // First get location by slug to get coordinates
    const location = await getLocationBySlug(params.slug)
    if (!location) {
      return NextResponse.json(
        {
          success: false,
          error: 'Location not found'
        },
        { status: 404 }
      )
    }

    // Fetch weather data with caching
    const weatherData = await getOrSet(
      CacheKeys.weather(location.name),
      async () => {
        console.log(`🌤️ Fetching fresh weather for "${location.name}"`)
        return await fetchWeatherData(location.name)
      },
      CacheTTL.WEATHER // 6 hours
    )

    return NextResponse.json({
      success: true,
      data: weatherData
    })
  } catch (error) {
    console.error('Error fetching weather:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch weather data'
      },
      { status: 500 }
    )
  }
}

