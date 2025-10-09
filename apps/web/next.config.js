/** @type {import('next').NextConfig} */
// PWA configuration (disabled for development)
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development'
// })

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'xquipbscibwganfvfynv.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'nchhcxokrzabbkvhzsor.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: '*.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'images.rawpixel.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
      },
      // Openverse (aggregates Flickr, Wikimedia, etc.)
      {
        protocol: 'https',
        hostname: '*.flickr.com',
      },
      {
        protocol: 'https',
        hostname: 'live.staticflickr.com',
      },
      {
        protocol: 'https',
        hostname: 'farm*.staticflickr.com',
      },
      // Europeana
      {
        protocol: 'https',
        hostname: 'api.europeana.eu',
      },
      {
        protocol: 'https',
        hostname: '*.europeana.eu',
      },
      // Smithsonian
      {
        protocol: 'https',
        hostname: 'ids.si.edu',
      },
      {
        protocol: 'https',
        hostname: '*.si.edu',
      },
      // NYPL
      {
        protocol: 'https',
        hostname: 'images.nypl.org',
      },
      {
        protocol: 'http',
        hostname: 'images.nypl.org',
      },
      // Library of Congress
      {
        protocol: 'https',
        hostname: 'tile.loc.gov',
      },
      {
        protocol: 'https',
        hostname: 'www.loc.gov',
      },
      {
        protocol: 'https',
        hostname: '*.loc.gov',
      },
      // Met Museum
      {
        protocol: 'https',
        hostname: 'images.metmuseum.org',
      },
      {
        protocol: 'https',
        hostname: 'collectionapi.metmuseum.org',
      },
      // StockSnap (free stock photos)
      {
        protocol: 'https',
        hostname: 'cdn.stocksnap.io',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable compression
  compress: true,
  // Enable SWC minification
  swcMinify: true,
  // Optimize for production
  productionBrowserSourceMaps: false,
  // Webpack aliases to stub heavy libs until installed
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@tremor/react': require('path').resolve(__dirname, 'shims/tremor-react.ts'),
      'leaflet': require('path').resolve(__dirname, 'shims/leaflet.ts'),
      'react-leaflet': require('path').resolve(__dirname, 'shims/react-leaflet.ts'),
      '@turf/turf': require('path').resolve(__dirname, 'shims/turf.ts'),
      'react-map-gl': require('path').resolve(__dirname, 'shims/react-map-gl.ts'),
      'mapbox-gl': require('path').resolve(__dirname, 'shims/mapbox-gl.ts'),
      'leaflet/dist/leaflet.css': require('path').resolve(__dirname, 'shims/empty.css'),
      'mapbox-gl/dist/mapbox-gl.css': require('path').resolve(__dirname, 'shims/empty.css'),
    }
    return config
  },
  // Security headers + Performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      // Aggressive caching for optimized images
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Cache static assets
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  // Rewrites for PWA
  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/_next/static/sw.js'
      }
    ]
  }
}

// Export without PWA for now (can be enabled later)
module.exports = nextConfig
// module.exports = withPWA(nextConfig)
