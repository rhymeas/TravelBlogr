import { Button } from '@/components/ui/Button'
import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'

const features = [
  'Unlimited trips and stories',
  'Audience-specific sharing',
  'Advanced privacy controls',
  'Interactive maps and media',
  'Real-time collaboration',
  'Analytics and insights',
]

export function CTA() {
  return (
    <section className="bg-blue-600 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to transform how you share your travels?
          </h2>
          <p className="mt-6 text-lg leading-8 text-blue-100">
            Join thousands of travelers who have already discovered the power of audience-specific sharing.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="rounded-3xl bg-white/10 backdrop-blur-sm p-8 ring-1 ring-white/20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">
                  Everything you need to get started
                </h3>
                <ul className="space-y-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center text-blue-100">
                      <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="text-center lg:text-left">
                <div className="mb-6">
                  <div className="text-4xl font-bold text-white mb-2">Free</div>
                  <div className="text-blue-100">Forever plan available</div>
                  <div className="text-sm text-blue-200 mt-1">No credit card required</div>
                </div>
                
                <div className="space-y-4">
                  <Button asChild size="lg" className="w-full bg-white text-blue-600 hover:bg-gray-100 group">
                    <Link href="/auth/signup">
                      Start Your Journey Today
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full border-white/30 text-white hover:bg-white/10"
                  >
                    View Live Demo
                  </Button>
                </div>
                
                <div className="mt-6 text-sm text-blue-200">
                  ✨ Special launch offer: Premium features free for 3 months
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-blue-100 text-sm">
            Trusted by travelers from 50+ countries • GDPR compliant • 99.9% uptime
          </p>
        </div>
      </div>
    </section>
  )
}
