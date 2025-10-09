import type { Metadata, Viewport } from 'next'
// import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import './globals.css'
import './nprogress.css'
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'
import { MobileNavigation } from '@/components/mobile/MobileNavigation'
import { AuthAwareHeader } from '@/components/layout/AuthAwareHeader'
import { Footer } from '@/components/layout/Footer'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ImagePreconnect } from '@/components/performance/ImagePreconnect'

// const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  colorScheme: 'light dark'
}

export const metadata: Metadata = {
  title: {
    default: 'TravelBlogr - Share Your Journey, Plan Your Next Adventure',
    template: '%s | TravelBlogr',
  },
  description: 'Transform your travel experiences into inspiring stories that help fellow travelers plan unforgettable trips. Share detailed timelines and discover your next destination through authentic community experiences.',
  keywords: ['travel', 'blog', 'journey', 'sharing', 'photography', 'stories', 'planning', 'destinations', 'community'],
  authors: [{ name: 'TravelBlogr Team' }],
  creator: 'TravelBlogr',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'TravelBlogr - Share Your Journey, Plan Your Next Adventure',
    description: 'Transform your travel experiences into inspiring stories that help fellow travelers plan unforgettable trips',
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
    title: 'TravelBlogr - Share Your Journey, Plan Your Next Adventure',
    description: 'Transform your travel experiences into inspiring stories that help fellow travelers plan unforgettable trips',
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
      <head>
        <ImagePreconnect />
      </head>
      <body className={cn('min-h-screen bg-background antialiased')}>
        <ProgressBar />
        <div className="relative flex min-h-screen flex-col">
          <AuthAwareHeader />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileNavigation />
        </div>
        <PWAInstallPrompt />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </body>
    </html>
  )
}
