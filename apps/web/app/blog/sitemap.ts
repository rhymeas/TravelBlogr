import { MetadataRoute } from 'next'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * Dynamic Sitemap for Blog
 * 
 * Generates sitemap.xml for all published blog posts and pages.
 * Helps search engines discover and index content.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://travelblogr.com'
  const supabase = await createServerSupabase()

  // Fetch all published blog posts
  const { data: posts } = await supabase
    .from('cms_posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  // Fetch all published destinations
  const { data: destinations } = await supabase
    .from('blog_destinations')
    .select('slug, updated_at')
    .eq('is_featured', true)
    .order('updated_at', { ascending: false })

  // Static blog pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog/posts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  // Blog post pages
  const postPages: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${baseUrl}/blog/posts/${post.slug}`,
    lastModified: new Date(post.updated_at || post.published_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Destination pages
  const destinationPages: MetadataRoute.Sitemap = (destinations || []).map((dest) => ({
    url: `${baseUrl}/blog/destinations/${dest.slug}`,
    lastModified: new Date(dest.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...postPages, ...destinationPages]
}

