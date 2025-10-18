import { MetadataRoute } from 'next'

/**
 * Robots.txt Configuration
 * 
 * Tells search engines which pages to crawl and which to avoid.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://travelblogr.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/blog-cms/',
          '/earnings/',
          '/_next/',
          '/admin/',
        ],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/blog/sitemap.xml`,
    ],
  }
}

