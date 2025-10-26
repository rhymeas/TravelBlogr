import Link from 'next/link'
import { getSEOTags } from '@/lib/seo'
import { SchemaTags } from '@/components/seo/SchemaTags'

export const metadata = getSEOTags({
  title: 'Privacy Policy',
  canonicalUrlRelative: '/privacy-policy',
})

const lastUpdated = new Date().toISOString().slice(0, 10)

export default function PrivacyPolicyPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy | TravelBlogr',
    url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/privacy-policy',
    isPartOf: {
      '@type': 'WebSite',
      name: 'TravelBlogr',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <SchemaTags data={schema} />
      <Link href="/" className="btn btn-ghost">← Back</Link>
      <h1 className="text-3xl font-extrabold mt-4 mb-6">Privacy Policy for TravelBlogr</h1>
      <p className="text-sm text-gray-500 mb-6">Last Updated: {lastUpdated}</p>

      <div className="prose prose-neutral max-w-none">
        <p>
          Thank you for using TravelBlogr ("we", "us", or "our"). This Privacy Policy
          explains how we collect, use, and protect your information when you use our website and services.
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          We may collect personal information such as your name, email address, and payment details when you create an account
          or purchase credits. We also collect non-personal data (like cookies, device info, and usage data) to improve performance
          and user experience.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          We use your information to provide and improve the TravelBlogr platform, process transactions, deliver customer support,
          send important updates, and maintain security. We do not sell your personal information.
        </p>

        <h2>3. Data Sharing</h2>
        <p>
          We may share data with service providers (e.g., payment processors, email providers) strictly to operate our services.
          These providers are bound by confidentiality and data protection obligations.
        </p>

        <h2>4. Children&apos;s Privacy</h2>
        <p>TravelBlogr is not intended for children under 13. We do not knowingly collect data from children.</p>

        <h2>5. Updates</h2>
        <p>
          We may update this policy to reflect changes to our practices. We will post the updated policy here and update the date above.
        </p>

        <h2>6. Contact</h2>
        <p>
          For questions about this Privacy Policy, please contact us via the contact page or support email listed on our site.
        </p>
      </div>
    </main>
  )
}

