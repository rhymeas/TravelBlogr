import { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cookie Policy | TravelBlogr',
  description: 'Cookie Policy for TravelBlogr - How we use cookies and similar technologies',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
        <div className="mb-8">
          <Link href="/" className="text-rausch-500 hover:text-rausch-600 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies?</h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files that are placed on your device when you visit a website. They are widely used to make 
              websites work more efficiently and provide information to website owners.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Cookies</h2>
            <p className="text-gray-700 mb-4">
              TravelBlogr uses cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Keep you signed in to your account</li>
              <li>Remember your preferences and settings</li>
              <li>Understand how you use our platform</li>
              <li>Improve our services and user experience</li>
              <li>Provide security and prevent fraud</li>
              <li>Deliver relevant content and features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.1 Essential Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies are necessary for the website to function properly. They enable core functionality such as security, 
              authentication, and accessibility.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-semibold">Cookie Name</th>
                    <th className="text-left py-2 font-semibold">Purpose</th>
                    <th className="text-left py-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b border-gray-100">
                    <td className="py-2">sb-*-auth-token</td>
                    <td className="py-2">Authentication session</td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2">sb-*-auth-token-code-verifier</td>
                    <td className="py-2">OAuth security</td>
                    <td className="py-2">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.2 Functional Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies enable enhanced functionality and personalization, such as remembering your preferences.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-semibold">Cookie Name</th>
                    <th className="text-left py-2 font-semibold">Purpose</th>
                    <th className="text-left py-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b border-gray-100">
                    <td className="py-2">theme</td>
                    <td className="py-2">Remember theme preference</td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2">language</td>
                    <td className="py-2">Remember language preference</td>
                    <td className="py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.3 Analytics Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                We may use analytics services to track page views, user interactions, and performance metrics. These cookies do not 
                collect personally identifiable information.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.4 Performance Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies collect information about how you use our website, such as which pages you visit most often and if you 
              receive error messages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Cookies</h2>
            <p className="text-gray-700 mb-4">
              We use services from third parties that may set their own cookies:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Google OAuth:</strong> For authentication when you sign in with Google</li>
              <li><strong>Cloudinary:</strong> For optimized image delivery</li>
              <li><strong>Supabase:</strong> For authentication and database services</li>
            </ul>
            <p className="text-gray-700 mb-4">
              These third parties have their own privacy policies and cookie policies. We recommend reviewing them:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer" className="text-rausch-500 hover:underline">Google Cookie Policy</a></li>
              <li><a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-rausch-500 hover:underline">Cloudinary Privacy Policy</a></li>
              <li><a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-rausch-500 hover:underline">Supabase Privacy Policy</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Local Storage</h2>
            <p className="text-gray-700 mb-4">
              In addition to cookies, we use browser local storage to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Store your authentication session</li>
              <li>Cache data for better performance</li>
              <li>Remember your preferences</li>
              <li>Store draft content before you're logged in</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Managing Cookies</h2>
            <p className="text-gray-700 mb-4">
              You can control and manage cookies in several ways:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.1 Browser Settings</h3>
            <p className="text-gray-700 mb-4">
              Most browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>View and delete cookies</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies</li>
              <li>Clear cookies when you close your browser</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Learn how to manage cookies in popular browsers:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-rausch-500 hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-rausch-500 hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-rausch-500 hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-rausch-500 hover:underline">Microsoft Edge</a></li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.2 Impact of Blocking Cookies</h3>
            <p className="text-gray-700 mb-4">
              Please note that blocking or deleting cookies may impact your experience on TravelBlogr:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>You may not be able to stay signed in</li>
              <li>Some features may not work properly</li>
              <li>Your preferences may not be saved</li>
              <li>The website may load more slowly</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Do Not Track</h2>
            <p className="text-gray-700 mb-4">
              Some browsers have a "Do Not Track" feature that signals to websites that you do not want to be tracked. Currently, 
              there is no industry standard for how to respond to Do Not Track signals. We do not currently respond to Do Not Track 
              signals, but we are committed to respecting your privacy choices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Updates to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for legal reasons. 
              We will notify you of any material changes by posting the new policy on this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about our use of cookies, please contact us:
            </p>
            <ul className="list-none text-gray-700 space-y-2 mb-4">
              <li><strong>Email:</strong> <a href="mailto:privacy@travelblogr.com" className="text-rausch-500 hover:underline">privacy@travelblogr.com</a></li>
              <li><strong>Website:</strong> <a href="https://travelblogr-production.up.railway.app" className="text-rausch-500 hover:underline">https://travelblogr-production.up.railway.app</a></li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Link href="/privacy" className="text-rausch-500 hover:text-rausch-600 font-medium">
              View Privacy Policy →
            </Link>
            <Link href="/terms" className="text-rausch-500 hover:text-rausch-600 font-medium">
              View Terms of Service →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

