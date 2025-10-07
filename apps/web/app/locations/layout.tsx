import { ReactNode } from 'react'

export default function LocationsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Preconnect to external image domains for faster loading */}
      <link rel="preconnect" href="https://upload.wikimedia.org" />
      <link rel="preconnect" href="https://commons.wikimedia.org" />
      <link rel="dns-prefetch" href="https://upload.wikimedia.org" />
      <link rel="dns-prefetch" href="https://commons.wikimedia.org" />
      
      {children}
    </>
  )
}

