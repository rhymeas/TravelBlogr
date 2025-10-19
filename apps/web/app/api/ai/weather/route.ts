import { NextRequest, NextResponse } from 'next/server'
import { createGroqClient } from '@/lib/groq'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/weather
 * Get weather information for a location using GROQ function calling
 * 
 * This demonstrates GROQ's function calling capability to fetch real-time data.
 * The LLM decides when to call the weather function based on user query.
 */
export async function POST(request: NextRequest) {
  try {
    const { location, query } = await request.json()

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      )
    }

    console.log(`🌤️ Getting weather for: ${location}`)

    const groq = createGroqClient()

    // Define the weather function tool
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "get_current_weather",
          description: "Get the current weather for a location",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city and country, e.g. Tokyo, Japan"
              },
              unit: {
                type: "string",
                enum: ["celsius", "fahrenheit"],
                description: "The temperature unit to use"
              }
            },
            required: ["location"]
          }
        }
      }
    ]

    // First call: LLM decides if it needs to call the function
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{
        role: "user",
        content: query || `What's the weather like in ${location}?`
      }],
      tools: tools,
      tool_choice: "auto"
    })

    const responseMessage = response.choices[0]?.message

    // Check if the LLM wants to call a function
    const toolCalls = responseMessage?.tool_calls

    if (toolCalls && toolCalls.length > 0) {
      // LLM decided to call the weather function
      const functionCall = toolCalls[0]
      const functionArgs = JSON.parse(functionCall.function.arguments)

      console.log(`📞 LLM calling function: ${functionCall.function.name}`)
      console.log(`📋 Arguments:`, functionArgs)

      // Call our weather function
      const weatherData = await getCurrentWeather(
        functionArgs.location,
        functionArgs.unit || "celsius"
      )

      // Second call: Give the function result back to the LLM
      const secondResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: query || `What's the weather like in ${location}?`
          },
          responseMessage,
          {
            role: "tool",
            content: JSON.stringify(weatherData),
            tool_call_id: functionCall.id
          }
        ],
        tools: tools
      })

      const finalResponse = secondResponse.choices[0]?.message?.content

      return NextResponse.json({
        success: true,
        response: finalResponse,
        weatherData: weatherData,
        functionCalled: true
      })
    }

    // LLM didn't need to call a function
    return NextResponse.json({
      success: true,
      response: responseMessage?.content,
      functionCalled: false
    })

  } catch (error) {
    console.error('Error getting weather:', error)
    return NextResponse.json(
      { error: 'Failed to get weather information' },
      { status: 500 }
    )
  }
}

/**
 * Get current weather for a location
 * 
 * In production, this would call a real weather API (OpenWeather, WeatherAPI, etc.)
 * For now, we'll use a free weather API or return mock data
 */
async function getCurrentWeather(location: string, unit: string = "celsius"): Promise<any> {
  try {
    // Try to use OpenWeather API if available
    const apiKey = process.env.OPENWEATHER_API_KEY

    if (apiKey) {
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
          windSpeed: data.wind.speed,
          icon: data.weather[0].icon,
          source: 'OpenWeather'
        }
      }
    }

    // Fallback: Use free weather API (wttr.in)
    const response = await fetch(
      `https://wttr.in/${encodeURIComponent(location)}?format=j1`
    )

    if (response.ok) {
      const data = await response.json()
      const current = data.current_condition[0]

      return {
        location: location,
        temperature: unit === 'celsius' ? current.temp_C : current.temp_F,
        unit: unit,
        condition: current.weatherDesc[0].value,
        humidity: current.humidity,
        windSpeed: current.windspeedKmph,
        feelsLike: unit === 'celsius' ? current.FeelsLikeC : current.FeelsLikeF,
        source: 'wttr.in'
      }
    }

    // Final fallback: Return mock data
    console.warn('⚠️ Using mock weather data - no API key configured')
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

  } catch (error) {
    console.error('Error fetching weather:', error)
    // Return mock data on error
    return {
      location: location,
      temperature: 22,
      unit: unit,
      condition: "Data unavailable",
      source: 'error',
      error: 'Failed to fetch weather data'
    }
  }
}

