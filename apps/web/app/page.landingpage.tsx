'use client'

import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturedDestinations } from '@/components/landing/FeaturedDestinations'
import { AboutStory } from '@/components/landing/AboutStory'
import { StatsSection } from '@/components/landing/StatsSection'
import { TravelTimeline } from '@/components/landing/TravelTimeline'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { RecentAdventures } from '@/components/landing/RecentAdventures'
import { NewsletterSignup } from '@/components/landing/NewsletterSignup'
import { Footer } from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <section id="destinations">
        <FeaturedDestinations />
      </section>
      <section id="about">
        <AboutStory />
      </section>
      <StatsSection />
      <section id="timeline">
        <TravelTimeline />
      </section>
      <TestimonialsSection />
      <section id="stories">
        <RecentAdventures />
      </section>
      <section id="contact">
        <NewsletterSignup />
      </section>
      <Footer />
    </main>
  )
}