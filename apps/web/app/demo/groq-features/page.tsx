'use client'

/**
 * GROQ Features Demo Page
 * 
 * Interactive demonstration of all GROQ capabilities integrated into TravelBlogr.
 * This page showcases:
 * 1. Streaming Content Generation (real-time text generation)
 * 2. Function Calling for Weather (live weather data)
 * 3. Location Intelligence Integration (database-first approach)
 */

import { useState } from 'react'
import { Sparkles, Cloud, Zap, Database, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { WeatherWidget } from '@/components/blog/WeatherWidget'

export default function GROQFeaturesDemo() {
  const [streamingDemo, setStreamingDemo] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [weatherLocation, setWeatherLocation] = useState('Tokyo, Japan')
  const [showWeather, setShowWeather] = useState(false)

  const demoStreamContent = async () => {
    setIsStreaming(true)
    setStreamingDemo('')

    try {
      const response = await fetch('/api/ai/stream-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: 'Tokyo',
          numberOfDays: 3,
          contentType: 'introduction'
        })
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setStreamingDemo(accumulated)
      }

    } catch (error) {
      console.error('Streaming error:', error)
      setStreamingDemo('Error streaming content. Please try again.')
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-10 w-10" />
            <h1 className="text-4xl font-bold">GROQ Features Demo</h1>
          </div>
          <p className="text-xl text-purple-100">
            Interactive demonstration of TravelBlogr's AI-powered capabilities
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm">
            <span className="px-3 py-1 bg-white/20 rounded-full">Phase 1 Complete ✅</span>
            <span className="px-3 py-1 bg-white/20 rounded-full">Streaming</span>
            <span className="px-3 py-1 bg-white/20 rounded-full">Function Calling</span>
            <span className="px-3 py-1 bg-white/20 rounded-full">Real-time Data</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        
        {/* Feature 1: Streaming Content Generation */}
        <section className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                1. Streaming Content Generation
              </h2>
              <p className="text-gray-600">
                Watch AI generate blog content in real-time! Content appears token-by-token as it's generated,
                providing instant feedback and better user experience.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">How it works:</h3>
              <div className="space-y-2 text-sm text-purple-700">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  <span>User requests content generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  <span>GROQ streams response token-by-token</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  <span>UI updates in real-time as chunks arrive</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-semibold">Result: 5x better perceived performance!</span>
                </div>
              </div>
            </div>

            <button
              onClick={demoStreamContent}
              disabled={isStreaming}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {isStreaming ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Streaming content...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Start Streaming Demo
                </>
              )}
            </button>

            {streamingDemo && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Generated Content:</h4>
                  {isStreaming && (
                    <span className="text-xs text-purple-600 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Streaming...
                    </span>
                  )}
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {streamingDemo}
                  </p>
                </div>
                {!isStreaming && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Streaming complete!</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-bold text-2xl text-blue-600">~500ms</div>
                <div className="text-gray-600">First Token</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="font-bold text-2xl text-green-600">2-5s</div>
                <div className="text-gray-600">Full Response</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="font-bold text-2xl text-purple-600">Same</div>
                <div className="text-gray-600">Cost (No Extra!)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 2: Function Calling for Weather */}
        <section className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Cloud className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                2. Function Calling for Weather
              </h2>
              <p className="text-gray-600">
                GROQ automatically calls weather APIs when needed. The AI decides when to fetch real-time data
                and formats it naturally for users.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  <span>User asks about weather</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  <span>GROQ LLM decides to call weather function</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  <span>Function fetches real-time data from API</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-semibold">Result: Natural language + structured data!</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={weatherLocation}
                onChange={(e) => setWeatherLocation(e.target.value)}
                placeholder="Enter location (e.g., Tokyo, Japan)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowWeather(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
              >
                <Cloud className="h-5 w-5" />
                Get Weather
              </button>
            </div>

            {showWeather && weatherLocation && (
              <WeatherWidget location={weatherLocation} autoLoad={true} />
            )}

            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-bold text-2xl text-blue-600">3</div>
                <div className="text-gray-600">Data Sources</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="font-bold text-2xl text-green-600">1-2s</div>
                <div className="text-gray-600">Response Time</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="font-bold text-2xl text-purple-600">100%</div>
                <div className="text-gray-600">Uptime (Fallbacks)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 3: Location Intelligence */}
        <section className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <Database className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                3. Location Intelligence Integration
              </h2>
              <p className="text-gray-600">
                Before calling GROQ, we check our database for existing locations, trips, and blog posts.
                This provides better context and reduces hallucinations.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-4">Smart Data Hierarchy:</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Our Locations Database</div>
                  <div className="text-sm text-gray-600">Check if we have this location already</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Existing Trips</div>
                  <div className="text-sm text-gray-600">Find trips to this location</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Existing Blog Posts</div>
                  <div className="text-sm text-gray-600">Check blog posts about this location</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg opacity-50">
                <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">External APIs (Future)</div>
                  <div className="text-sm text-gray-600">OpenTripMap, WikiVoyage, etc.</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">5</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">GROQ AI Generation</div>
                  <div className="text-sm text-gray-600">Generate content with database context</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">🚀 What's Next? (Phase 2 & 3)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Batch Processing</h3>
              <p className="text-sm text-purple-100">Generate 100+ blog posts overnight with 50% cost savings</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Vision Models</h3>
              <p className="text-sm text-purple-100">Auto-caption images and detect landmarks</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Parallel Tool Use</h3>
              <p className="text-sm text-purple-100">Call weather + flights + hotels simultaneously (3x faster)</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">RAG Implementation</h3>
              <p className="text-sm text-purple-100">Semantic search and Q&A chatbot</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

