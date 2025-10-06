'use client'

import Link from 'next/link'
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  UserPlus, 
  Star, 
  Camera,
  MapPin,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface SignUpPromptProps {
  context?: 'feed' | 'location' | 'interaction'
  trigger?: string
  className?: string
}

export function SignUpPrompt({ 
  context = 'feed', 
  trigger = 'like',
  className = ""
}: SignUpPromptProps) {
  const getPromptContent = () => {
    switch (context) {
      case 'feed':
        return {
          icon: Heart,
          title: 'Join the Travel Community',
          description: 'Like, comment, and save travel stories from adventurers around the world.',
          features: [
            { icon: Heart, text: 'Like and save posts' },
            { icon: MessageCircle, text: 'Comment and connect' },
            { icon: UserPlus, text: 'Follow travelers' },
            { icon: Bookmark, text: 'Save for later' }
          ],
          cta: 'Start Exploring'
        }
      
      case 'location':
        return {
          icon: MapPin,
          title: 'Plan Your Perfect Trip',
          description: 'Save locations, add personal notes, and create your travel wishlist.',
          features: [
            { icon: Bookmark, text: 'Save to wishlist' },
            { icon: Star, text: 'Rate locations' },
            { icon: Camera, text: 'Add to trips' },
            { icon: MapPin, text: 'Personal notes' }
          ],
          cta: 'Start Planning'
        }
      
      case 'interaction':
        return {
          icon: UserPlus,
          title: `Sign up to ${trigger}`,
          description: 'Join thousands of travelers sharing their adventures and planning new ones.',
          features: [
            { icon: Sparkles, text: 'Share your stories' },
            { icon: Heart, text: 'Connect with travelers' },
            { icon: MapPin, text: 'Discover destinations' },
            { icon: Camera, text: 'Create trip albums' }
          ],
          cta: 'Join TravelBlogr'
        }
      
      default:
        return {
          icon: Heart,
          title: 'Join TravelBlogr',
          description: 'Share your journey, plan your next adventure.',
          features: [],
          cta: 'Get Started'
        }
    }
  }

  const content = getPromptContent()
  const IconComponent = content.icon

  return (
    <Card className={`card-elevated p-6 text-center bg-gradient-to-br from-rausch-50 to-orange-50 border-rausch-200 ${className}`}>
      <div className="mb-4">
        <div className="w-16 h-16 bg-rausch-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <IconComponent className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-title-medium text-airbnb-black mb-2">{content.title}</h3>
        <p className="text-body-large text-airbnb-dark-gray">{content.description}</p>
      </div>

      {content.features.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {content.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-left">
              <div className="w-8 h-8 bg-white rounded-airbnb-small flex items-center justify-center shadow-airbnb-light">
                <feature.icon className="h-4 w-4 text-rausch-500" />
              </div>
              <span className="text-body-medium text-airbnb-black">{feature.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <Button asChild className="btn-primary w-full">
          <Link href="/auth/signup" className="flex items-center justify-center gap-2 whitespace-nowrap">
            <span>{content.cta}</span>
            <ArrowRight className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </Button>
        
        <div className="text-body-small text-airbnb-gray">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-rausch-500 hover:text-rausch-600 font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </div>


    </Card>
  )
}

// Specific prompt variants for common use cases
export function FeedSignUpPrompt({ className }: { className?: string }) {
  return <SignUpPrompt context="feed" className={className} />
}

export function LocationSignUpPrompt({ className }: { className?: string }) {
  return <SignUpPrompt context="location" className={className} />
}

export function InteractionSignUpPrompt({ 
  trigger, 
  className 
}: { 
  trigger: string
  className?: string 
}) {
  return <SignUpPrompt context="interaction" trigger={trigger} className={className} />
}

// Inline prompt for feed interactions
export function InlineFeedPrompt() {
  return (
    <div className="bg-white border-t border-b border-airbnb-border p-4 my-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-rausch-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-body-large font-medium text-airbnb-black mb-1">
              Want to interact with posts?
            </h4>
            <p className="text-body-medium text-airbnb-gray">
              Join to like, comment, and save travel stories
            </p>
          </div>
          <Button asChild size="sm" className="btn-primary">
            <Link href="/auth/signup">
              Sign Up
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Sticky bottom prompt for mobile
export function StickySignUpPrompt() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-airbnb-border p-4 shadow-airbnb-xl z-50 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-rausch-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Heart className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-body-medium font-medium text-airbnb-black">Join TravelBlogr</div>
          <div className="text-body-small text-airbnb-gray">Share your journey with the world</div>
        </div>
        <Button asChild size="sm" className="btn-primary">
          <Link href="/auth/signup">
            Sign Up
          </Link>
        </Button>
      </div>
    </div>
  )
}
