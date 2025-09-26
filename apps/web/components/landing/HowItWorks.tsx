import { PlusCircle, Settings, Share2, Eye } from 'lucide-react'

const steps = [
  {
    name: 'Create Your Trip',
    description: 'Start by creating a new trip and adding your photos, stories, and locations.',
    icon: PlusCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    name: 'Customize for Audiences',
    description: 'Set up different views for family, friends, and professional contacts.',
    icon: Settings,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    name: 'Generate Share Links',
    description: 'Create unique links that show the right content to the right people.',
    icon: Share2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    name: 'Track Engagement',
    description: 'See who viewed your content and how they engaged with your stories.',
    icon: Eye,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
]

export function HowItWorks() {
  return (
    <section className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">How it works</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Share your journey in 4 simple steps
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            From creation to sharing, TravelBlogr makes it easy to tell your story to the right audience.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-0">
            {steps.map((step, stepIdx) => (
              <div key={step.name} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-full ${step.bgColor} mb-6`}>
                    <step.icon className={`h-8 w-8 ${step.color}`} aria-hidden="true" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {stepIdx + 1}. {step.name}
                  </h3>
                  
                  <p className="text-gray-600">{step.description}</p>
                </div>
                
                {stepIdx < steps.length - 1 && (
                  <div className="absolute top-8 left-1/2 hidden lg:block">
                    <div className="h-0.5 w-full bg-gray-200" style={{ width: '100px', marginLeft: '32px' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Ready to start sharing your adventures?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of travelers who are already using TravelBlogr to share their journeys.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                Get Started Free
              </button>
              <button className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50">
                View Examples
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
