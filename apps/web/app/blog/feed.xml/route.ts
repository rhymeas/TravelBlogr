import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * RSS Feed for Blog
 * 
 * Generates RSS 2.0 feed for all published blog posts.
 * Allows users to subscribe to blog updates via RSS readers.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://travelblogr.com'
  const supabase = await createServerSupabase()

  // Fetch latest 50 published posts
  const { data: posts } = await supabase
    .from('cms_posts')
    .select(`
      id,
      title,
      slug,
      excerpt,
      published_at,
      updated_at,
      category,
      tags,
      profiles!author_id (
        full_name,
        username
      )
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50)

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TravelBlogr Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Travel stories, guides, and tips from the TravelBlogr community</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    ${(posts || [])
      .map(
        (post: any) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/posts/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/posts/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
      ${post.category ? `<category>${post.category}</category>` : ''}
      ${post.profiles ? `<author>${post.profiles.full_name || post.profiles.username}</author>` : ''}
    </item>`
      )
      .join('')}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

