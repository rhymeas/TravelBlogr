'use client'

/**
 * Weather Widget Component
 * 
 * Displays real-time weather information for a location using GROQ function calling.
 * Demonstrates GROQ's ability to call external APIs and integrate real-time data.
 */

import { useState, useEffect } from 'react'
import { Cloud, Loader2, Droplets, Wind, ThermometerSun } from 'lucide-react'

interface WeatherWidgetProps {
  location: string
  autoLoad?: boolean
}

interface WeatherData {
  location: string
  temperature: number
  unit: string
  condition: string
  humidity?: number
  windSpeed?: number
  feelsLike?: number
  icon?: string
  source: string
}

export function WeatherWidget({ location, autoLoad = false }: WeatherWidgetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/locations/weather?location=${encodeURIComponent(location)}`)

      if (!response.ok) {
        throw new Error('Failed to fetch weather')
      }

      const data = await response.json()

      if (data.success && data.data) {
        setWeather(data.data)
      } else {
        throw new Error('No weather data received')
      }

    } catch (err) {
      console.error('Weather fetch error:', err)
      setError('Unable to load weather data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (autoLoad && location) {
      fetchWeather()
    }
  }, [location, autoLoad])

  if (!weather && !isLoading && !error) {
    return (
      <button
        onClick={fetchWeather}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
      >
        <Cloud className="h-4 w-4" />
        Show Current Weather
      </button>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span className="text-sm text-blue-700">Loading weather...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-3 bg-red-50 rounded-lg">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={fetchWeather}
          className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!weather) return null

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            Current Weather
          </h3>
          <p className="text-sm text-gray-600">{weather.location}</p>
        </div>
        <button
          onClick={fetchWeather}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Temperature */}
        <div className="col-span-2">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-gray-900">
              {weather.temperature}°
            </span>
            <span className="text-2xl text-gray-600">
              {weather.unit === 'celsius' ? 'C' : 'F'}
            </span>
          </div>
          <p className="text-lg text-gray-700 mt-1 capitalize">{weather.condition}</p>
        </div>

        {/* Feels Like */}
        {weather.feelsLike !== undefined && (
          <div className="flex items-center gap-2">
            <ThermometerSun className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-gray-600">Feels like</p>
              <p className="text-sm font-semibold text-gray-900">
                {weather.feelsLike}°{weather.unit === 'celsius' ? 'C' : 'F'}
              </p>
            </div>
          </div>
        )}

        {/* Humidity */}
        {weather.humidity !== undefined && (
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-600">Humidity</p>
              <p className="text-sm font-semibold text-gray-900">{weather.humidity}%</p>
            </div>
          </div>
        )}

        {/* Wind Speed */}
        {weather.windSpeed !== undefined && (
          <div className="flex items-center gap-2 col-span-2">
            <Wind className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-600">Wind Speed</p>
              <p className="text-sm font-semibold text-gray-900">
                {weather.windSpeed} {weather.unit === 'celsius' ? 'km/h' : 'mph'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Data Source */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-xs text-gray-500">
          Powered by GROQ Function Calling • Data from {weather.source}
        </p>
      </div>
    </div>
  )
}

