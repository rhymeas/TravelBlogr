import { Resend } from 'resend'
import { render } from '@react-email/render'
import WelcomeEmail from '@/components/email/WelcomeEmail'
import TripSharedEmail from '@/components/email/TripSharedEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  from?: string
  replyTo?: string
}

export interface WelcomeEmailData {
  userFirstName: string
  userEmail: string
  loginUrl?: string
}

export interface TripSharedEmailData {
  recipientName: string
  senderName: string
  tripTitle: string
  tripDescription: string
  tripImage?: string
  shareUrl: string
  message?: string
}

export interface TripInviteEmailData {
  recipientName: string
  senderName: string
  tripTitle: string
  inviteUrl: string
  message?: string
}

export interface PasswordResetEmailData {
  userFirstName: string
  resetUrl: string
  expiresIn: string
}

export interface EmailVerificationData {
  userFirstName: string
  verificationUrl: string
}

const defaultFrom = process.env.RESEND_FROM_EMAIL || 'TravelBlogr <noreply@travelblogr.com>'

export class EmailService {
  private static instance: EmailService
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  private async sendEmail(options: EmailOptions, html: string): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured, skipping email send')
        return false
      }

      const { data, error } = await resend.emails.send({
        from: options.from || defaultFrom,
        to: options.to,
        subject: options.subject,
        html,
        replyTo: options.replyTo,
      })

      if (error) {
        console.error('Email send error:', error)
        return false
      }

      console.log('Email sent successfully:', data?.id)
      return true
    } catch (error) {
      console.error('Email service error:', error)
      return false
    }
  }

  async sendWelcomeEmail(
    to: string,
    data: WelcomeEmailData,
    options?: Partial<EmailOptions>
  ): Promise<boolean> {
    const html = await render(WelcomeEmail({
      userFirstName: data.userFirstName,
      userEmail: data.userEmail,
      loginUrl: data.loginUrl,
    }))

    return this.sendEmail({
      to,
      subject: `Welcome to TravelBlogr, ${data.userFirstName}! ✈️`,
      ...options,
    }, html)
  }

  async sendTripSharedEmail(
    to: string,
    data: TripSharedEmailData,
    options?: Partial<EmailOptions>
  ): Promise<boolean> {
    const html = await render(TripSharedEmail({
      recipientName: data.recipientName,
      senderName: data.senderName,
      tripTitle: data.tripTitle,
      tripDescription: data.tripDescription,
      tripImage: data.tripImage,
      shareUrl: data.shareUrl,
      message: data.message,
    }))

    return this.sendEmail({
      to,
      subject: `${data.senderName} shared their trip "${data.tripTitle}" with you`,
      ...options,
    }, html)
  }

  async sendTripInviteEmail(
    to: string,
    data: TripInviteEmailData,
    options?: Partial<EmailOptions>
  ): Promise<boolean> {
    // For now, we'll use a simple HTML template
    // You can create a dedicated TripInviteEmail component later
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>You're invited to collaborate on a trip! 🎉</h1>
        <p>Hi ${data.recipientName},</p>
        <p>${data.senderName} has invited you to collaborate on their trip "${data.tripTitle}".</p>
        ${data.message ? `<blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007bff;">"${data.message}"</blockquote>` : ''}
        <p><a href="${data.inviteUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
        <p>Happy travels!<br>The TravelBlogr Team</p>
      </div>
    `

    return this.sendEmail({
      to,
      subject: `You're invited to collaborate on "${data.tripTitle}"`,
      ...options,
    }, html)
  }

  async sendPasswordResetEmail(
    to: string,
    data: PasswordResetEmailData,
    options?: Partial<EmailOptions>
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Reset Your Password 🔐</h1>
        <p>Hi ${data.userFirstName},</p>
        <p>We received a request to reset your password for your TravelBlogr account.</p>
        <p><a href="${data.resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in ${data.expiresIn}. If you didn't request this reset, you can safely ignore this email.</p>
        <p>Best regards,<br>The TravelBlogr Team</p>
      </div>
    `

    return this.sendEmail({
      to,
      subject: 'Reset your TravelBlogr password',
      ...options,
    }, html)
  }

  async sendEmailVerification(
    to: string,
    data: EmailVerificationData,
    options?: Partial<EmailOptions>
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Verify Your Email Address ✉️</h1>
        <p>Hi ${data.userFirstName},</p>
        <p>Thanks for signing up for TravelBlogr! Please verify your email address to complete your registration.</p>
        <p><a href="${data.verificationUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
        <p>If you didn't create an account with TravelBlogr, you can safely ignore this email.</p>
        <p>Welcome aboard!<br>The TravelBlogr Team</p>
      </div>
    `

    return this.sendEmail({
      to,
      subject: 'Verify your TravelBlogr email address',
      ...options,
    }, html)
  }

  async sendNotificationEmail(
    to: string,
    subject: string,
    content: string,
    options?: Partial<EmailOptions>
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #007bff; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">TravelBlogr</h1>
        </div>
        <div style="padding: 20px;">
          ${content}
        </div>
        <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent by TravelBlogr. If you no longer wish to receive these emails, you can unsubscribe.</p>
        </div>
      </div>
    `

    return this.sendEmail({
      to,
      subject,
      ...options,
    }, html)
  }

  async sendBulkEmail(
    recipients: string[],
    subject: string,
    content: string,
    options?: Partial<EmailOptions>
  ): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    // Send emails in batches to avoid rate limits
    const batchSize = 10
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      
      const promises = batch.map(async (email) => {
        const result = await this.sendNotificationEmail(email, subject, content, options)
        return result ? 'success' : 'failed'
      })

      const results = await Promise.all(promises)
      success += results.filter(r => r === 'success').length
      failed += results.filter(r => r === 'failed').length

      // Add delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return { success, failed }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance()

// Utility functions for common email operations
export async function sendWelcomeEmail(to: string, data: WelcomeEmailData) {
  return emailService.sendWelcomeEmail(to, data)
}

export async function sendTripSharedEmail(to: string, data: TripSharedEmailData) {
  return emailService.sendTripSharedEmail(to, data)
}

export async function sendTripInviteEmail(to: string, data: TripInviteEmailData) {
  return emailService.sendTripInviteEmail(to, data)
}

export async function sendPasswordResetEmail(to: string, data: PasswordResetEmailData) {
  return emailService.sendPasswordResetEmail(to, data)
}

export async function sendEmailVerification(to: string, data: EmailVerificationData) {
  return emailService.sendEmailVerification(to, data)
}

// Email template preview functions (for development)
export function previewWelcomeEmail(data: WelcomeEmailData) {
  return render(WelcomeEmail(data))
}

export function previewTripSharedEmail(data: TripSharedEmailData) {
  return render(TripSharedEmail(data))
}
