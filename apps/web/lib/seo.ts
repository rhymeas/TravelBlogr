import type { Metadata } from 'next'

export type GetSEOTagsInput = {
  title?: string
  description?: string
  canonicalUrlRelative?: string
  images?: string[]
}

export function getSEOTags({ title, description, canonicalUrlRelative, images }: GetSEOTagsInput): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const canonical = canonicalUrlRelative ? new URL(canonicalUrlRelative, baseUrl).toString() : undefined

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'TravelBlogr',
      images: images?.map((url) => ({ url }))
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images && images.length > 0 ? [images[0]] : undefined
    }
  }
}

