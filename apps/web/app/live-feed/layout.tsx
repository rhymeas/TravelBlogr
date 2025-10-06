import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Travel Feed | TravelBlogr',
  description: 'Discover real-time travel moments, stories, and inspiration from travelers around the world. Instagram-style feed of authentic travel experiences.',
}

export default function LiveFeedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
