import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | TravelBlogr',
  description: 'Terms of Service for TravelBlogr - Rules and guidelines for using our platform',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
        <div className="mb-8">
          <Link href="/" className="text-rausch-500 hover:text-rausch-600 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing or using TravelBlogr ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
              If you do not agree to these Terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              TravelBlogr is a platform that allows users to create, share, and discover travel stories and experiences. 
              The Service includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Creating and managing travel trips and itineraries</li>
              <li>Sharing travel stories, photos, and experiences</li>
              <li>Discovering locations and travel content from other users</li>
              <li>Commenting and interacting with other travelers</li>
              <li>Generating AI-powered travel itineraries</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.1 Account Creation</h3>
            <p className="text-gray-700 mb-4">
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.2 Account Eligibility</h3>
            <p className="text-gray-700 mb-4">
              You must be at least 13 years old to use the Service. If you are under 18, you must have permission from a 
              parent or guardian.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Content</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.1 Your Content</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of all content you create and share on TravelBlogr ("User Content"). By posting User Content, 
              you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and display 
              your User Content for the purpose of operating and improving the Service.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.2 Content Guidelines</h3>
            <p className="text-gray-700 mb-4">You agree not to post User Content that:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Violates any law or regulation</li>
              <li>Infringes on intellectual property rights of others</li>
              <li>Contains hate speech, harassment, or discrimination</li>
              <li>Is sexually explicit or pornographic</li>
              <li>Promotes violence or illegal activities</li>
              <li>Contains spam, malware, or phishing attempts</li>
              <li>Impersonates another person or entity</li>
              <li>Violates the privacy of others</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.3 Content Moderation</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to remove any User Content that violates these Terms or is otherwise objectionable, 
              at our sole discretion. We are not responsible for User Content posted by others.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Prohibited Activities</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems (bots, scrapers) without permission</li>
              <li>Collect or harvest personal information of other users</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Sell, rent, or lease access to the Service</li>
              <li>Use the Service to send spam or unsolicited messages</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The Service, including its design, features, and functionality, is owned by TravelBlogr and is protected by 
              copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create 
              derivative works without our express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              The Service may contain links to third-party websites or services. We are not responsible for the content, 
              privacy policies, or practices of third-party services. Your use of third-party services is at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-gray-700 mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
              WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. YOU USE THE SERVICE AT YOUR OWN RISK.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRAVELBLOGR SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, 
              OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold harmless TravelBlogr and its officers, directors, employees, and agents from any 
              claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service or 
              violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account and access to the Service at any time, with or without notice, for any 
              reason, including violation of these Terms. You may also delete your account at any time through your account settings.
            </p>
            <p className="text-gray-700 mb-4">
              Upon termination, your right to use the Service will immediately cease. Sections that by their nature should survive 
              termination will survive, including ownership provisions, warranty disclaimers, and limitations of liability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the new 
              Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes 
              acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which TravelBlogr 
              operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration, 
              except where prohibited by law. You waive your right to participate in class action lawsuits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="list-none text-gray-700 space-y-2 mb-4">
              <li><strong>Email:</strong> <a href="mailto:legal@travelblogr.com" className="text-rausch-500 hover:underline">legal@travelblogr.com</a></li>
              <li><strong>Website:</strong> <a href="https://travelblogr-production.up.railway.app" className="text-rausch-500 hover:underline">https://travelblogr-production.up.railway.app</a></li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Link href="/privacy" className="text-rausch-500 hover:text-rausch-600 font-medium">
              View Privacy Policy →
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

