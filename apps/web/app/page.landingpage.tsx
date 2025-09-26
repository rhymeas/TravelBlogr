'use client'

import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturedDestinations } from '@/components/landing/FeaturedDestinations'
import { AboutStory } from '@/components/landing/AboutStory'
import { RecentAdventures } from '@/components/landing/RecentAdventures'
import { NewsletterSignup } from '@/components/landing/NewsletterSignup'
import { Footer } from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturedDestinations />
      <AboutStory />
      <RecentAdventures />
      <NewsletterSignup />
      <Footer />
    </main>
  )
}