import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/locations/weather?location=NAME
 * 
 * Fetch weather data for a location using the working weather system:
 * 1. Try OpenWeatherMap API (if API key configured)
 * 2. Fallback to wttr.in (free, unlimited)
 * 3. Final fallback to mock data
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface WeatherData {
  location: string
  temperature: number
  unit: string
  condition: string
  humidity: number
  windSpeed: number
  feelsLike?: number
  source: string
  note?: string
}

async function getCurrentWeather(
  location: string,
  unit: 'celsius' | 'fahrenheit' = 'celsius'
): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHER_API_KEY

  // Try OpenWeatherMap first (if API key configured)
  if (apiKey) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=${unit === 'celsius' ? 'metric' : 'imperial'}`
      )

      if (response.ok) {
        const data = await response.json()
        return {
          location: data.name,
          temperature: Math.round(data.main.temp),
          unit: unit,
          condition: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed),
          feelsLike: Math.round(data.main.feels_like),
          source: 'OpenWeatherMap'
        }
      }
    } catch (error) {
      console.error('OpenWeather API error:', error)
    }
  }

  // Fallback: Use free weather API (wttr.in)
  try {
    const response = await fetch(
      `https://wttr.in/${encodeURIComponent(location)}?format=j1`
    )

    if (response.ok) {
      const data = await response.json()
      const current = data.current_condition[0]

      return {
        location: location,
        temperature: parseInt(unit === 'celsius' ? current.temp_C : current.temp_F),
        unit: unit,
        condition: current.weatherDesc[0].value,
        humidity: parseInt(current.humidity),
        windSpeed: parseInt(current.windspeedKmph),
        feelsLike: parseInt(unit === 'celsius' ? current.FeelsLikeC : current.FeelsLikeF),
        source: 'wttr.in'
      }
    }
  } catch (error) {
    console.error('wttr.in API error:', error)
  }

  // Final fallback: Return mock data
  console.warn('⚠️ Using mock weather data - no API available')
  return {
    location: location,
    temperature: 22,
    unit: unit,
    condition: "Partly cloudy",
    humidity: 65,
    windSpeed: 15,
    source: 'mock',
    note: 'This is mock data. Configure OPENWEATHER_API_KEY for real weather.'
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get('location')
    const unit = (searchParams.get('unit') || 'celsius') as 'celsius' | 'fahrenheit'

    if (!location) {
      return NextResponse.json(
        {
          success: false,
          error: 'Location parameter is required'
        },
        { status: 400 }
      )
    }

    const weatherData = await getCurrentWeather(location, unit)

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

