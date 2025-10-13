import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | TravelBlogr',
  description: 'Privacy Policy for TravelBlogr - How we collect, use, and protect your data',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
        <div className="mb-8">
          <Link href="/" className="text-rausch-500 hover:text-rausch-600 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to TravelBlogr ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our website and tell you 
              about your privacy rights and how the law protects you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 mb-4">We collect and process the following types of information:</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Account Information:</strong> Name, email address, username, and password when you create an account</li>
              <li><strong>Profile Information:</strong> Profile picture, bio, and other optional profile details</li>
              <li><strong>Content:</strong> Travel stories, photos, comments, and other content you create or share</li>
              <li><strong>Communications:</strong> Messages you send to us or other users</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Information We Collect Automatically</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the platform</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
              <li><strong>Cookies:</strong> We use cookies and similar technologies (see our Cookie Policy)</li>
              <li><strong>Location Data:</strong> Approximate location based on IP address (with your consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information for the following purposes:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Provide Services:</strong> To create and manage your account, enable you to create and share travel content</li>
              <li><strong>Personalization:</strong> To customize your experience and show relevant content</li>
              <li><strong>Communication:</strong> To send you updates, notifications, and respond to your inquiries</li>
              <li><strong>Security:</strong> To protect against fraud, abuse, and security threats</li>
              <li><strong>Analytics:</strong> To understand how users interact with our platform and improve our services</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Services</h2>
            <p className="text-gray-700 mb-4">We use the following third-party services:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Supabase:</strong> Database and authentication services (see <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-rausch-500 hover:underline">Supabase Privacy Policy</a>)</li>
              <li><strong>Google OAuth:</strong> For Google sign-in (see <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-rausch-500 hover:underline">Google Privacy Policy</a>)</li>
              <li><strong>Cloudinary:</strong> Image hosting and optimization (see <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-rausch-500 hover:underline">Cloudinary Privacy Policy</a>)</li>
              <li><strong>Railway:</strong> Hosting infrastructure (see <a href="https://railway.app/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-rausch-500 hover:underline">Railway Privacy Policy</a>)</li>
              <li><strong>Analytics:</strong> We may use analytics services to understand usage patterns</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">We do not sell your personal data. We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Public Content:</strong> Content you choose to make public (trips, posts, comments) is visible to other users</li>
              <li><strong>Service Providers:</strong> With third-party service providers who help us operate our platform</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly consent to sharing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, 
              alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure hosting infrastructure</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-700 mb-4">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Objection:</strong> Object to processing of your data</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="text-gray-700 mb-4">
              To exercise these rights, please contact us at <a href="mailto:privacy@travelblogr.com" className="text-rausch-500 hover:underline">privacy@travelblogr.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your personal data only for as long as necessary to fulfill the purposes outlined in this privacy policy, 
              unless a longer retention period is required by law. When you delete your account, we will delete or anonymize your 
              personal data within 30 days, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              TravelBlogr is not intended for children under 13 years of age. We do not knowingly collect personal information from 
              children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure 
              appropriate safeguards are in place to protect your data in accordance with this privacy policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this privacy policy from time to time. We will notify you of any material changes by posting the new 
              privacy policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this privacy policy or our data practices, please contact us:
            </p>
            <ul className="list-none text-gray-700 space-y-2 mb-4">
              <li><strong>Email:</strong> <a href="mailto:privacy@travelblogr.com" className="text-rausch-500 hover:underline">privacy@travelblogr.com</a></li>
              <li><strong>Website:</strong> <a href="https://travelblogr-production.up.railway.app" className="text-rausch-500 hover:underline">https://travelblogr-production.up.railway.app</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. GDPR Compliance (EU Users)</h2>
            <p className="text-gray-700 mb-4">
              If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection 
              Regulation (GDPR). For more information, see our <Link href="/gdpr" className="text-rausch-500 hover:underline">GDPR Compliance page</Link>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Link href="/terms" className="text-rausch-500 hover:text-rausch-600 font-medium">
              View Terms of Service →
            </Link>
            <Link href="/cookies" className="text-rausch-500 hover:text-rausch-600 font-medium">
              View Cookie Policy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

