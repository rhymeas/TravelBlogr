import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'GDPR Compliance | TravelBlogr',
  description: 'GDPR Compliance information for TravelBlogr - Your rights under EU data protection law',
}

export default function GDPRPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
        <div className="mb-8">
          <Link href="/" className="text-rausch-500 hover:text-rausch-600 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">GDPR Compliance</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              The General Data Protection Regulation (GDPR) is a comprehensive data protection law that applies to organizations 
              processing personal data of individuals in the European Economic Area (EEA). TravelBlogr is committed to complying 
              with GDPR and protecting your privacy rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Your Rights Under GDPR</h2>
            <p className="text-gray-700 mb-4">
              If you are located in the EEA, you have the following rights regarding your personal data:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1 Right to Access</h3>
            <p className="text-gray-700 mb-4">
              You have the right to request a copy of the personal data we hold about you. We will provide this information in a 
              structured, commonly used, and machine-readable format.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-sm text-blue-900">
                <strong>How to exercise:</strong> Email us at <a href="mailto:privacy@travelblogr.com" className="underline">privacy@travelblogr.com</a> with 
                the subject "GDPR Access Request"
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Right to Rectification</h3>
            <p className="text-gray-700 mb-4">
              You have the right to request correction of inaccurate or incomplete personal data.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-sm text-blue-900">
                <strong>How to exercise:</strong> Update your information in your account settings, or contact us at 
                <a href="mailto:privacy@travelblogr.com" className="underline"> privacy@travelblogr.com</a>
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.3 Right to Erasure ("Right to be Forgotten")</h3>
            <p className="text-gray-700 mb-4">
              You have the right to request deletion of your personal data in certain circumstances, such as when:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>The data is no longer necessary for the purposes it was collected</li>
              <li>You withdraw consent and there is no other legal basis for processing</li>
              <li>You object to processing and there are no overriding legitimate grounds</li>
              <li>The data has been unlawfully processed</li>
            </ul>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-sm text-blue-900">
                <strong>How to exercise:</strong> Delete your account in settings, or email us at 
                <a href="mailto:privacy@travelblogr.com" className="underline"> privacy@travelblogr.com</a> with the subject "GDPR Erasure Request"
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.4 Right to Data Portability</h3>
            <p className="text-gray-700 mb-4">
              You have the right to receive your personal data in a structured, commonly used, and machine-readable format and 
              transmit it to another controller.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-sm text-blue-900">
                <strong>How to exercise:</strong> Email us at <a href="mailto:privacy@travelblogr.com" className="underline">privacy@travelblogr.com</a> with 
                the subject "GDPR Portability Request"
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.5 Right to Restrict Processing</h3>
            <p className="text-gray-700 mb-4">
              You have the right to request restriction of processing of your personal data in certain circumstances.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.6 Right to Object</h3>
            <p className="text-gray-700 mb-4">
              You have the right to object to processing of your personal data based on legitimate interests or for direct marketing purposes.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.7 Right to Withdraw Consent</h3>
            <p className="text-gray-700 mb-4">
              Where we rely on consent to process your personal data, you have the right to withdraw that consent at any time.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.8 Right to Lodge a Complaint</h3>
            <p className="text-gray-700 mb-4">
              You have the right to lodge a complaint with a supervisory authority, particularly in the EU member state where you 
              reside, work, or where an alleged infringement of GDPR occurred.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Legal Basis for Processing</h2>
            <p className="text-gray-700 mb-4">
              We process your personal data based on the following legal grounds:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Consent:</strong> You have given clear consent for us to process your personal data for specific purposes</li>
              <li><strong>Contract:</strong> Processing is necessary to fulfill our contract with you (providing the Service)</li>
              <li><strong>Legal Obligation:</strong> Processing is necessary to comply with legal obligations</li>
              <li><strong>Legitimate Interests:</strong> Processing is necessary for our legitimate interests (e.g., improving our service, 
              preventing fraud) and does not override your rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect and process the following categories of personal data:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Identity Data:</strong> Name, username, email address</li>
              <li><strong>Profile Data:</strong> Profile picture, bio, preferences</li>
              <li><strong>Content Data:</strong> Travel stories, photos, comments you create</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
              <li><strong>Usage Data:</strong> How you interact with our platform</li>
            </ul>
            <p className="text-gray-700 mb-4">
              For more details, see our <Link href="/privacy" className="text-rausch-500 hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Account Data:</strong> Retained while your account is active, deleted within 30 days of account deletion</li>
              <li><strong>Content:</strong> Retained while your account is active, deleted with account deletion</li>
              <li><strong>Analytics Data:</strong> Anonymized after 26 months</li>
              <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your personal data may be transferred to and processed in countries outside the EEA. We ensure appropriate safeguards 
              are in place:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Standard Contractual Clauses approved by the European Commission</li>
              <li>Adequacy decisions by the European Commission</li>
              <li>Binding Corporate Rules</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Our service providers (Supabase, Railway, Cloudinary) have appropriate data protection measures in place.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Encryption of data at rest</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Employee training on data protection</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Breach Notification</h2>
            <p className="text-gray-700 mb-4">
              In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Notify the relevant supervisory authority within 72 hours of becoming aware of the breach</li>
              <li>Notify affected individuals without undue delay if the breach is likely to result in a high risk</li>
              <li>Provide information about the nature of the breach and measures taken</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Automated Decision-Making</h2>
            <p className="text-gray-700 mb-4">
              We may use automated decision-making in limited circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Content Recommendations:</strong> AI-powered suggestions for travel destinations and content</li>
              <li><strong>Spam Detection:</strong> Automated filtering of spam and abusive content</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You have the right to request human intervention, express your point of view, and contest automated decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. How to Exercise Your Rights</h2>
            <p className="text-gray-700 mb-4">
              To exercise any of your GDPR rights, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <ul className="list-none text-gray-700 space-y-2">
                <li><strong>Email:</strong> <a href="mailto:privacy@travelblogr.com" className="text-rausch-500 hover:underline">privacy@travelblogr.com</a></li>
                <li><strong>Subject Line:</strong> Include "GDPR Request" and specify which right you're exercising</li>
                <li><strong>Response Time:</strong> We will respond within 30 days (may be extended by 2 months for complex requests)</li>
              </ul>
            </div>
            <p className="text-gray-700 mb-4">
              We may need to verify your identity before processing your request. We will not charge a fee unless your request is 
              manifestly unfounded or excessive.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Supervisory Authority</h2>
            <p className="text-gray-700 mb-4">
              If you are not satisfied with our response or believe we are processing your data unlawfully, you have the right to 
              lodge a complaint with your local data protection authority. You can find your local authority at:
            </p>
            <p className="text-gray-700 mb-4">
              <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="text-rausch-500 hover:underline">
                European Data Protection Board - List of Supervisory Authorities
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For any questions about GDPR compliance or to exercise your rights:
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

