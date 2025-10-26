'use client'

export const dynamic = 'force-dynamic'


/**
 * Weather System Test Page
 * 
 * Tests the working weather system that uses:
 * - OpenWeatherMap API for real-time data
 * - Database caching (location_weather table)
 * - Fallback to wttr.in if OpenWeather fails
 * - Mock data as final fallback
 */

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer } from 'lucide-react'

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

export default function TestWeatherPage() {
  const [location, setLocation] = useState('Barcelona')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testLocations = [
    'Barcelona',
    'Tokyo',
    'New York',
    'Paris',
    'Sydney',
    'London',
    'Rome',
    'Dubai'
  ]

  const fetchWeather = async (locationName: string) => {
    setLoading(true)
    setError(null)
    setWeather(null)

    try {
      // Test the working weather API endpoint
      const response = await fetch(`/api/locations/weather?location=${encodeURIComponent(locationName)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        setWeather(data.data)
      } else {
        throw new Error(data.error || 'No weather data received')
      }

    } catch (err) {
      console.error('Weather fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch weather')
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase()
    if (lower.includes('rain')) return <CloudRain className="h-12 w-12 text-blue-500" />
    if (lower.includes('cloud')) return <Cloud className="h-12 w-12 text-gray-500" />
    if (lower.includes('sun') || lower.includes('clear')) return <Sun className="h-12 w-12 text-yellow-500" />
    return <Cloud className="h-12 w-12 text-gray-400" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            🌤️ Weather System Test
          </h1>
          <p className="text-gray-600">
            Testing the working OpenWeatherMap integration
          </p>
        </div>

        {/* Search */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter location name..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchWeather(location)}
                className="flex-1"
              />
              <Button 
                onClick={() => fetchWeather(location)}
                disabled={loading || !location}
              >
                {loading ? 'Loading...' : 'Get Weather'}
              </Button>
            </div>

            {/* Quick Test Buttons */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 w-full">Quick test:</span>
              {testLocations.map((loc) => (
                <Button
                  key={loc}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLocation(loc)
                    fetchWeather(loc)
                  }}
                  disabled={loading}
                >
                  {loc}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <div className="text-red-600 font-semibold">❌ Error:</div>
              <div className="text-red-700">{error}</div>
            </div>
          </Card>
        )}

        {/* Weather Display */}
        {weather && (
          <Card className="p-8">
            <div className="space-y-6">
              {/* Location & Icon */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {weather.location}
                  </h2>
                  <p className="text-gray-600 capitalize">{weather.condition}</p>
                </div>
                {getWeatherIcon(weather.condition)}
              </div>

              {/* Temperature */}
              <div className="flex items-baseline gap-2">
                <Thermometer className="h-8 w-8 text-red-500" />
                <span className="text-6xl font-bold text-gray-900">
                  {weather.temperature}°
                </span>
                <span className="text-2xl text-gray-600">
                  {weather.unit === 'celsius' ? 'C' : 'F'}
                </span>
                {weather.feelsLike && (
                  <span className="text-sm text-gray-500 ml-4">
                    Feels like {weather.feelsLike}°
                  </span>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Droplets className="h-6 w-6 text-blue-500" />
                  <div>
                    <div className="text-sm text-gray-600">Humidity</div>
                    <div className="text-lg font-semibold">{weather.humidity}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Wind className="h-6 w-6 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-600">Wind Speed</div>
                    <div className="text-lg font-semibold">{weather.windSpeed} km/h</div>
                  </div>
                </div>
              </div>

              {/* Data Source */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Data source:</span>
                  <span className="font-semibold text-gray-900">{weather.source}</span>
                </div>
                {weather.note && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    ℹ️ {weather.note}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* System Info */}
        <Card className="p-6 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-3">
            ✅ Working Weather System
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div>• <strong>Primary:</strong> OpenWeatherMap API (1,000 calls/day free)</div>
            <div>• <strong>Fallback:</strong> wttr.in (free, unlimited)</div>
            <div>• <strong>Cache:</strong> Database caching in location_weather table</div>
            <div>• <strong>Cron:</strong> Auto-sync every 6 hours via /api/cron/sync-weather</div>
            <div>• <strong>Endpoint:</strong> /api/locations/weather?location=NAME</div>
          </div>
        </Card>

        {/* API Info */}
        <Card className="p-6 bg-blue-50">
          <h3 className="font-semibold text-gray-900 mb-3">
            🔧 API Configuration
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div>
              <strong>OPENWEATHER_API_KEY:</strong>{' '}
              {process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ? 
                <span className="text-green-600">✓ Configured</span> : 
                <span className="text-red-600">✗ Missing</span>
              }
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Get your free API key at: https://openweathermap.org/api
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

