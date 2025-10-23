import { Metadata } from 'next'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pricing - TravelBlogr',
  description: 'Simple, transparent pricing for sharing your travel stories. Start free, upgrade when you need more.',
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for casual travelers sharing their adventures',
    features: [
      'Up to 3 trips',
      'Unlimited photos per trip',
      'Basic trip timeline',
      'Public sharing links',
      'Community features',
      'Mobile app access',
    ],
    limitations: [
      'No custom domains',
      'TravelBlogr branding',
      'Limited storage (1GB)',
    ],
    cta: 'Start Free',
    href: '/auth/signup',
    popular: false,
  },
  {
    name: 'Explorer',
    price: '$9',
    period: 'per month',
    description: 'For frequent travelers who want more control',
    features: [
      'Unlimited trips',
      'Unlimited photos & videos',
      'Advanced timeline features',
      'Custom trip URLs',
      'Remove TravelBlogr branding',
      'Priority support',
      'Analytics & insights',
      'Export your data',
      '10GB storage',
    ],
    limitations: [],
    cta: 'Start 14-Day Trial',
    href: '/auth/signup?plan=explorer',
    popular: true,
  },
  {
    name: 'Professional',
    price: '$29',
    period: 'per month',
    description: 'For travel bloggers and content creators',
    features: [
      'Everything in Explorer',
      'Custom domain support',
      'Advanced SEO tools',
      'Monetization features',
      'Collaboration tools',
      'White-label options',
      'API access',
      'Dedicated support',
      '100GB storage',
    ],
    limitations: [],
    cta: 'Start 14-Day Trial',
    href: '/auth/signup?plan=professional',
    popular: false,
  },
]

const faqs = [
  {
    question: 'Can I change plans later?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.',
  },
  {
    question: 'What happens to my trips if I downgrade?',
    answer: 'Your trips remain safe. If you exceed the new plan\'s limits, older trips become read-only until you upgrade again or delete some trips.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! Explorer and Professional plans include a 14-day free trial. No credit card required to start.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely. Cancel anytime with one click. Your account remains active until the end of your billing period.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 30-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-rausch-50 to-kazan-50 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-display-large font-bold text-sleek-black mb-6">
                Simple, Transparent Pricing
              </h1>
              <p className="text-title-medium text-sleek-gray max-w-2xl mx-auto">
                Start free and upgrade when you need more. No hidden fees, no surprises.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border-2 p-8 ${
                    plan.popular
                      ? 'border-rausch-500 shadow-xl scale-105'
                      : 'border-gray-200 shadow-lg'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-rausch-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-sleek-black mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                      <span className="text-5xl font-bold text-sleek-black">
                        {plan.price}
                      </span>
                      <span className="text-sleek-gray">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-sleek-gray">{plan.description}</p>
                  </div>

                  <Button
                    asChild
                    className={`w-full mb-6 ${
                      plan.popular
                        ? 'bg-rausch-500 hover:bg-rausch-600 text-white'
                        : 'bg-white border-2 border-rausch-500 text-rausch-500 hover:bg-rausch-50'
                    }`}
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>

                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-sleek-dark-gray">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation) => (
                      <div key={limitation} className="flex items-start gap-3">
                        <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-sleek-gray line-through">
                          {limitation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-sleek-black mb-12 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question} className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-sleek-black mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sleek-gray">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-sleek-black mb-6">
              Ready to Share Your Journey?
            </h2>
            <p className="text-xl text-sleek-gray mb-8">
              Join thousands of travelers sharing their stories on TravelBlogr
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-rausch-500 hover:bg-rausch-600 text-white">
                <Link href="/auth/signup">Start Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/trips-library">View Examples</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

