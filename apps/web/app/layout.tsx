import type { Metadata, Viewport } from 'next'
// import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import './globals.css'
import './nprogress.css'
// import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt' // Disabled - too aggressive
import { MobileNavigation } from '@/components/mobile/MobileNavigation'
import { AuthAwareHeader } from '@/components/layout/AuthAwareHeader'
import { Footer } from '@/components/layout/Footer'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ImagePreconnect } from '@/components/performance/ImagePreconnect'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthModalProvider } from '@/contexts/AuthModalContext'
import { FeedbackButton } from '@/components/feedback/FeedbackButton'

// const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true, // Allow pinch-to-zoom
  viewportFit: 'cover', // For notched devices (iPhone X+)
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  colorScheme: 'light dark'
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
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
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    shortcut: '/favicon-16.svg',
    apple: '/apple-touch-icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning translate="yes">
      <head>
        <ImagePreconnect />

        {/* Browser Translation Support */}
        <meta httpEquiv="content-language" content="en" />
        <meta name="google" content="notranslate" />

        {/* ImageKit CDN - Preconnect for faster image loading */}
        <link rel="preconnect" href="https://ik.imagekit.io" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />

        {/* Google AdSense - Site Verification */}
        <meta name="google-adsense-account" content="ca-pub-5985120367077865" />
        {/* Google AdSense - Ad Script */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID || 'ca-pub-5985120367077865'}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className={cn('min-h-screen bg-background antialiased')} suppressHydrationWarning>
        <AuthProvider>
          <AuthModalProvider>
            <ProgressBar />
            <div className="relative flex min-h-screen flex-col" suppressHydrationWarning>
                <AuthAwareHeader />
                <main className="flex-1">{children}</main>
                <Footer />
                <MobileNavigation />
                <FeedbackButton />
              </div>
              {/* <PWAInstallPrompt /> */}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
            </AuthModalProvider>
          </AuthProvider>
      </body>
    </html>
  )
}
