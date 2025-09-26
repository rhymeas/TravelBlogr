import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'TravelBlogr - Share Your Journey',
    template: '%s | TravelBlogr',
  },
  description: 'Create beautiful travel stories and share them with different audiences - from professional portfolios to intimate family updates.',
  keywords: ['travel', 'blog', 'journey', 'sharing', 'photography', 'stories'],
  authors: [{ name: 'TravelBlogr Team' }],
  creator: 'TravelBlogr',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'TravelBlogr - Share Your Journey',
    description: 'Create beautiful travel stories and share them with different audiences',
    siteName: 'TravelBlogr',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TravelBlogr - Share Your Journey',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TravelBlogr - Share Your Journey',
    description: 'Create beautiful travel stories and share them with different audiences',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-background antialiased')}>
        <div className="relative flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>

      </body>
    </html>
  )
}
