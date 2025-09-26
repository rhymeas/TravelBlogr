'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Send, Check } from 'lucide-react'

export function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitted(true)
      setIsLoading(false)
    }, 1500)
  }

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0 aurora-bg opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="glass-effect rounded-3xl p-12 md:p-16 animate-fade-in-up">
          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                
                <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Join the
                  <span className="text-gradient block">Adventure</span>
                </h2>
                
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Get exclusive travel stories, photography tips, and destination guides 
                  delivered straight to your inbox. No spam, just pure wanderlust.
                </p>
              </div>

              {/* Newsletter Form */}
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-14 px-6 text-lg rounded-full border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                        Subscribing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Subscribe
                        <Send className="ml-2 h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>

              {/* Trust Indicators */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>No spam, ever</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Unsubscribe anytime</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>5,000+ happy subscribers</span>
                </div>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6">
                <Check className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Welcome to the
                <span className="text-gradient block">Journey!</span>
              </h2>
              
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
                Thank you for subscribing! Check your inbox for a welcome message and 
                get ready for amazing travel stories and exclusive content.
              </p>

              <Button
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail('')
                }}
                variant="outline"
                className="px-8 py-3 rounded-full font-semibold border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
              >
                Subscribe Another Email
              </Button>
            </div>
          )}
        </div>

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400/20 rounded-full animate-parallax-float" />
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-purple-400/20 rounded-full animate-parallax-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-5 w-12 h-12 bg-yellow-400/20 rounded-full animate-parallax-float" style={{ animationDelay: '4s' }} />
      </div>
    </section>
  )
}