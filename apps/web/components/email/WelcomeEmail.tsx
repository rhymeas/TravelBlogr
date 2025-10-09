import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface WelcomeEmailProps {
  userFirstName?: string
  userEmail?: string
  loginUrl?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://travelblogr.com'

export const WelcomeEmail = ({
  userFirstName = 'Traveler',
  userEmail = 'user@example.com',
  loginUrl = `${baseUrl}/auth/signin`,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to TravelBlogr - Start sharing your adventures!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src={`${baseUrl}/logo.png`}
            width="120"
            height="36"
            alt="TravelBlogr"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>Welcome to TravelBlogr! ✈️</Heading>
        
        <Text style={heroText}>
          Hi {userFirstName}, we're thrilled to have you join our community of travel enthusiasts!
        </Text>

        <Text style={text}>
          TravelBlogr is your perfect companion for documenting and sharing your travel adventures. 
          Whether you're creating professional travel portfolios, sharing memories with family, 
          or connecting with fellow travelers, we've got you covered.
        </Text>

        <Section style={featuresContainer}>
          <Text style={featuresTitle}>Here's what you can do with TravelBlogr:</Text>
          
          <div style={feature}>
            <Text style={featureIcon}>🗺️</Text>
            <div>
              <Text style={featureTitle}>Interactive Trip Planning</Text>
              <Text style={featureDescription}>Plan your plan with drag-and-drop scheduling and budget tracking</Text>
            </div>
          </div>

          <div style={feature}>
            <Text style={featureIcon}>📸</Text>
            <div>
              <Text style={featureTitle}>Smart Media Management</Text>
              <Text style={featureDescription}>Upload, compress, and organize your travel photos and videos</Text>
            </div>
          </div>

          <div style={feature}>
            <Text style={featureIcon}>🌍</Text>
            <div>
              <Text style={featureTitle}>Audience-Specific Sharing</Text>
              <Text style={featureDescription}>Share different versions of your trips with family, friends, or the public</Text>
            </div>
          </div>

          <div style={feature}>
            <Text style={featureIcon}>📱</Text>
            <div>
              <Text style={featureTitle}>Real-time Updates</Text>
              <Text style={featureDescription}>Share live location updates and instant trip moments</Text>
            </div>
          </div>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={loginUrl}>
            Start Your Journey
          </Button>
        </Section>

        <Text style={text}>
          Need help getting started? Check out our{' '}
          <Link href={`${baseUrl}/help`} style={link}>
            help center
          </Link>{' '}
          or reply to this email with any questions.
        </Text>

        <Hr style={hr} />

        <Section style={footerContainer}>
          <Text style={footerText}>
            Happy travels! 🎒<br />
            The TravelBlogr Team
          </Text>
          
          <Text style={footerLinks}>
            <Link href={`${baseUrl}/privacy`} style={footerLink}>Privacy Policy</Link>
            {' • '}
            <Link href={`${baseUrl}/terms`} style={footerLink}>Terms of Service</Link>
            {' • '}
            <Link href={`${baseUrl}/unsubscribe?email=${userEmail}`} style={footerLink}>Unsubscribe</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const logoContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const heroText = {
  color: '#1f2937',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  textAlign: 'left' as const,
}

const featuresContainer = {
  margin: '32px 0',
  padding: '0 20px',
}

const featuresTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 20px 0',
}

const feature = {
  display: 'flex',
  alignItems: 'flex-start',
  margin: '16px 0',
  gap: '12px',
}

const featureIcon = {
  fontSize: '20px',
  margin: '0',
  minWidth: '24px',
}

const featureTitle = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 4px 0',
}

const featureDescription = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '18px',
  margin: '0',
}

const buttonContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  margin: '0 auto',
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const footerContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
}

const footerLinks = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '16px 0',
}

const footerLink = {
  color: '#9ca3af',
  textDecoration: 'underline',
}
