import { Metadata } from 'next'
import { Hero } from '@/components/landing/Hero'
import { FeaturedJourneys } from '@/components/landing/FeaturedJourneys'
import { LiveFeedPreview } from '@/components/landing/LiveFeedPreview'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Testimonials } from '@/components/landing/Testimonials'
import { CTA } from '@/components/landing/CTA'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'TravelBlogr - Share Your Journey with Different Audiences',
  description: 'Create beautiful travel stories and share them with different audiences - from professional portfolios to intimate family updates. One trip, multiple experiences.',
}

// Enable static generation with revalidation for better performance
export const revalidate = 300 // Revalidate every 5 minutes

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero section with live statistics */}
        <Hero />

        {/* Featured journeys timeline - Kanada Reise inspired */}
        <FeaturedJourneys />

        {/* Live community feed preview */}
        <LiveFeedPreview />

        {/* Enhanced features section */}
        <Features />

        {/* How it works process */}
        <HowItWorks />

        {/* Social proof testimonials */}
        <Testimonials />

        {/* Final call-to-action */}
        <CTA />
      </main>
      <Footer />
    </>
  )
}
