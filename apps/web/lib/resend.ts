import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!resendClient) resendClient = new Resend(key)
  return resendClient
}

export async function sendPurchaseReceiptEmail({ to, credits, amountCents, sessionId }: { to: string, credits: number, amountCents: number, sessionId?: string }) {
  const resend = getResend()
  if (!resend) return { skipped: true }
  const usd = (amountCents / 100).toFixed(2)
  const html = `
    <div>
      <h2>Thank you for your purchase</h2>
      <p>You purchased <strong>${credits}</strong> credits for <strong>$${usd}</strong>.</p>
      ${sessionId ? `<p>Receipt ID: ${sessionId}</p>` : ''}
      <p>Happy travels! — TravelBlogr</p>
    </div>
  `
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'TravelBlogr <noreply@travelblogr.com>',
    to,
    subject: `Your TravelBlogr credits purchase (${credits})`,
    html,
  })
  if (error) throw error
  return data
}

