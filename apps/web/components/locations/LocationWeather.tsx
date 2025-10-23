'use client'

import {
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Cloud,
  CloudRain,
  Snowflake
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useEffect, useState } from 'react'

interface LocationWeatherProps {
  locationSlug?: string
  locationName: string
}

interface WeatherData {
  temperature: number
  feels_like: number
  condition: string
  description: string
  humidity: number
  wind_speed: number
  icon: string
  updated_at: string
}

// Helper function to get weather icon component from condition string
const getWeatherIcon = (condition: string) => {
  const conditionLower = condition.toLowerCase()
  if (conditionLower.includes('sun') || conditionLower.includes('clear')) return Sun
  if (conditionLower.includes('cloud')) return CloudSun
  if (conditionLower.includes('rain')) return CloudRain
  if (conditionLower.includes('snow')) return Snowflake
  return CloudSun
}

// Mock weather data - fallback when no real data available
const getWeatherData = (locationName: string) => {
  const weatherData = {
    'Santorini': {
      current: {
        temp: 24,
        condition: 'Sunny',
        humidity: 65,
        windSpeed: 12,
        icon: Sun
      },
      bestTime: 'April to October',
      seasons: [
        { season: 'Spring', months: 'Mar-May', temp: '18-24°C', condition: 'Mild & Pleasant', color: 'green' },
        { season: 'Summer', months: 'Jun-Aug', temp: '24-28°C', condition: 'Hot & Dry', color: 'orange' },
        { season: 'Fall', months: 'Sep-Nov', temp: '20-25°C', condition: 'Warm & Clear', color: 'yellow' },
        { season: 'Winter', months: 'Dec-Feb', temp: '12-16°C', condition: 'Cool & Windy', color: 'blue' }
      ]
    },
    'Banff National Park': {
      current: {
        temp: -2,
        condition: 'Snow',
        humidity: 80,
        windSpeed: 8,
        icon: Snowflake
      },
      bestTime: 'June to September',
      seasons: [
        { season: 'Spring', months: 'Mar-May', temp: '5-15°C', condition: 'Cool & Wet', color: 'green' },
        { season: 'Summer', months: 'Jun-Aug', temp: '15-25°C', condition: 'Warm & Clear', color: 'orange' },
        { season: 'Fall', months: 'Sep-Nov', temp: '0-15°C', condition: 'Cool & Crisp', color: 'yellow' },
        { season: 'Winter', months: 'Dec-Feb', temp: '-15-5°C', condition: 'Cold & Snowy', color: 'blue' }
      ]
    },
    'Tokyo': {
      current: {
        temp: 18,
        condition: 'Partly Cloudy',
        humidity: 72,
        windSpeed: 6,
        icon: CloudSun
      },
      bestTime: 'March to May, September to November',
      seasons: [
        { season: 'Spring', months: 'Mar-May', temp: '15-22°C', condition: 'Cherry Blossoms', color: 'green' },
        { season: 'Summer', months: 'Jun-Aug', temp: '25-30°C', condition: 'Hot & Humid', color: 'orange' },
        { season: 'Fall', months: 'Sep-Nov', temp: '18-25°C', condition: 'Mild & Clear', color: 'yellow' },
        { season: 'Winter', months: 'Dec-Feb', temp: '5-12°C', condition: 'Cool & Dry', color: 'blue' }
      ]
    }
  }

  return weatherData[locationName as keyof typeof weatherData] || {
    current: {
      temp: 20,
      condition: 'Pleasant',
      humidity: 60,
      windSpeed: 10,
      icon: CloudSun
    },
    bestTime: 'Year-round',
    seasons: [
      { season: 'Spring', months: 'Mar-May', temp: '18-24°C', condition: 'Mild', color: 'green' },
      { season: 'Summer', months: 'Jun-Aug', temp: '24-30°C', condition: 'Warm', color: 'orange' },
      { season: 'Fall', months: 'Sep-Nov', temp: '18-24°C', condition: 'Pleasant', color: 'yellow' },
      { season: 'Winter', months: 'Dec-Feb', temp: '10-18°C', condition: 'Cool', color: 'blue' }
    ]
  }
}

export function LocationWeather({ locationSlug, locationName }: LocationWeatherProps) {
  const [realWeather, setRealWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch real weather data if locationSlug is provided
  useEffect(() => {
    if (locationSlug) {
      fetch(`/api/locations/${locationSlug}/weather`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setRealWeather(data.data)
          }
        })
        .catch(err => console.error('Error fetching weather:', err))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [locationSlug])

  // Use real weather data if available, otherwise fallback to mock
  const weather = realWeather ? {
    current: {
      temp: realWeather.temperature,
      condition: realWeather.condition,
      humidity: realWeather.humidity,
      windSpeed: realWeather.wind_speed,
      icon: getWeatherIcon(realWeather.condition)
    },
    bestTime: getWeatherData(locationName).bestTime,
    seasons: getWeatherData(locationName).seasons
  } : getWeatherData(locationName)

  const CurrentIcon = weather.current.icon

  const getSeasonColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800 border-green-200'
      case 'orange': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Weather */}
      <Card className="card-elevated p-4">
        <h3 className="text-title-small text-sleek-black mb-3 flex items-center gap-2">
          <CloudSun className="h-5 w-5 text-blue-500" />
          Current Weather
        </h3>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CurrentIcon className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-title-medium text-sleek-black">{weather.current.temp}°C</div>
              <div className="text-body-small text-sleek-gray">{weather.current.condition}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-400" />
            <div>
              <div className="text-body-small text-sleek-gray">Humidity</div>
              <div className="text-body-medium text-sleek-black">{weather.current.humidity}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-400" />
            <div>
              <div className="text-body-small text-sleek-gray">Wind</div>
              <div className="text-body-medium text-sleek-black">{weather.current.windSpeed} km/h</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Best Time to Visit */}
      <Card className="card-elevated p-4">
        <h3 className="text-title-small text-sleek-black mb-3 flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-orange-500" />
          Best Time to Visit
        </h3>
        
        <div className="mb-4 p-3 bg-green-50 rounded-sleek-small border border-green-200">
          <div className="text-body-medium font-medium text-green-800 mb-1">Recommended</div>
          <div className="text-body-large text-green-700">{weather.bestTime}</div>
        </div>

        <div className="space-y-3">
          {weather.seasons.map((season, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-sleek-small border border-sleek-border hover:bg-sleek-background-secondary transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-body-medium font-medium text-sleek-black">{season.season}</span>
                  <Badge className={getSeasonColor(season.color)}>
                    {season.months}
                  </Badge>
                </div>
                <div className="text-body-small text-sleek-gray">{season.condition}</div>
              </div>
              <div className="text-body-medium text-sleek-black font-medium">
                {season.temp}
              </div>
            </div>
          ))}
        </div>
      </Card>


    </div>
  )
}
