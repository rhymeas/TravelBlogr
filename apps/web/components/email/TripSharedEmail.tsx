// @ts-nocheck - React Email has complex CSS type definitions
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

interface TripSharedEmailProps {
  recipientName?: string
  senderName?: string
  tripTitle?: string
  tripDescription?: string
  tripImage?: string
  shareUrl?: string
  message?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://travelblogr.com'

export const TripSharedEmail = ({
  recipientName = 'Friend',
  senderName = 'Travel Buddy',
  tripTitle = 'Amazing Adventure',
  tripDescription = 'An incredible journey filled with unforgettable moments.',
  tripImage = `${baseUrl}/default-trip-image.jpg`,
  shareUrl = `${baseUrl}/shared/trip`,
  message,
}: TripSharedEmailProps) => (
  <Html>
    <Head />
    <Preview>{senderName} shared their trip "{tripTitle}" with you!</Preview>
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
        
        <Heading style={h1}>You've been invited to view a trip! 🎉</Heading>
        
        <Text style={heroText}>
          Hi {recipientName}, {senderName} has shared their travel adventure with you.
        </Text>

        {/* Trip Card */}
        <Section style={tripCard}>
          <Img
            src={tripImage}
            width="560"
            height="200"
            alt={tripTitle}
            style={tripImage}
          />
          
          <div style={tripContent}>
            <Heading style={tripTitle}>{tripTitle}</Heading>
            <Text style={tripDescription}>{tripDescription}</Text>
            
            <div style={tripMeta}>
              <Text style={metaText}>
                <span style={metaLabel}>Shared by:</span> {senderName}
              </Text>
            </div>
          </div>
        </Section>

        {/* Personal Message */}
        {message && (
          <Section style={messageContainer}>
            <Text style={messageLabel}>Personal message from {senderName}:</Text>
            <div style={messageBox}>
              <Text style={messageText}>"{message}"</Text>
            </div>
          </Section>
        )}

        <Section style={buttonContainer}>
          <Button style={button} href={shareUrl}>
            View Trip
          </Button>
        </Section>

        <Text style={text}>
          This trip was shared with you through TravelBlogr. You can view all the photos, 
          stories, and memories that {senderName} has documented from their journey.
        </Text>

        <Section style={featuresContainer}>
          <Text style={featuresTitle}>What you'll find in this trip:</Text>
          
          <div style={feature}>
            <Text style={featureIcon}>📸</Text>
            <Text style={featureText}>High-quality photos and videos</Text>
          </div>

          <div style={feature}>
            <Text style={featureIcon}>📝</Text>
            <Text style={featureText}>Detailed stories and experiences</Text>
          </div>

          <div style={feature}>
            <Text style={featureIcon}>🗺️</Text>
            <Text style={featureText}>Interactive maps and locations</Text>
          </div>

          <div style={feature}>
            <Text style={featureIcon}>💡</Text>
            <Text style={featureText}>Travel tips and recommendations</Text>
          </div>
        </Section>

        <Hr style={hr} />

        <Section style={ctaContainer}>
          <Text style={ctaText}>
            Inspired by {senderName}'s adventure? Start documenting your own travels!
          </Text>
          <Button style={secondaryButton} href={`${baseUrl}/auth/signup`}>
            Join TravelBlogr
          </Button>
        </Section>

        <Hr style={hr} />

        <Section style={footerContainer}>
          <Text style={footerText}>
            Happy exploring! 🌍<br />
            The TravelBlogr Team
          </Text>
          
          <Text style={footerLinks}>
            <Link href={`${baseUrl}/privacy`} style={footerLink}>Privacy Policy</Link>
            {' • '}
            <Link href={`${baseUrl}/terms`} style={footerLink}>Terms of Service</Link>
            {' • '}
            <Link href={`${baseUrl}/help`} style={footerLink}>Help Center</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default TripSharedEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
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

const tripCard = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  margin: '32px 0',
  overflow: 'hidden',
}

const tripImage = {
  width: '100%',
  height: '200px',
  objectFit: 'cover' as const,
}

const tripContent = {
  padding: '24px',
}

const tripTitle = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const tripDescription = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px 0',
}

const tripMeta = {
  borderTop: '1px solid #e5e7eb',
  paddingTop: '16px',
}

const metaText = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
}

const metaLabel = {
  fontWeight: '600',
}

const messageContainer = {
  margin: '32px 0',
}

const messageLabel = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
}

const messageBox = {
  backgroundColor: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '16px',
}

const messageText = {
  color: '#374151',
  fontSize: '14px',
  fontStyle: 'italic',
  lineHeight: '20px',
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

const secondaryButton = {
  backgroundColor: '#ffffff',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  color: '#3b82f6',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 24px',
  margin: '0 auto',
}

const featuresContainer = {
  margin: '32px 0',
}

const featuresTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
}

const feature = {
  display: 'flex',
  alignItems: 'center',
  margin: '8px 0',
  gap: '8px',
}

const featureIcon = {
  fontSize: '16px',
  margin: '0',
  minWidth: '20px',
}

const featureText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
}

const ctaContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const ctaText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px 0',
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
