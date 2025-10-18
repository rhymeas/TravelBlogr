'use client'

/**
 * HeroSection - Blog hero with title, subtitle, and image collage
 * Inspired by the screenshot design
 * Uses existing OptimizedImage component and design tokens
 */

import { Button } from '@/components/ui/Button'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface HeroImage {
  src: string
  alt: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
}

interface HeroSectionProps {
  title: string
  subtitle?: string
  description?: string
  ctaText?: string
  ctaLink?: string
  images?: HeroImage[]
  variant?: 'default' | 'centered' | 'split'
  className?: string
}

export function HeroSection({
  title,
  subtitle,
  description,
  ctaText = 'Get Started',
  ctaLink = '#',
  images = [],
  variant = 'default',
  className
}: HeroSectionProps) {
  if (variant === 'split') {
    return (
      <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center', className)}>
        {/* Left: Content */}
        <div className="space-y-6">
          {subtitle && (
            <p className="text-sm font-medium text-rausch-500 uppercase tracking-wide">
              {subtitle}
            </p>
          )}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              {description}
            </p>
          )}
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="group">
              <Link href={ctaLink}>
                {ctaText}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Right: Image Collage */}
        {images.length > 0 && (
          <div className="relative h-[400px] lg:h-[500px]">
            <ImageCollage images={images} />
          </div>
        )}
      </div>
    )
  }

  if (variant === 'centered') {
    return (
      <div className={cn('text-center space-y-6 max-w-4xl mx-auto', className)}>
        {subtitle && (
          <p className="text-sm font-medium text-rausch-500 uppercase tracking-wide">
            {subtitle}
          </p>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        )}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg" className="group">
            <Link href={ctaLink}>
              {ctaText}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
        {images.length > 0 && (
          <div className="relative h-[300px] md:h-[400px] mt-12">
            <ImageCollage images={images} />
          </div>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn('space-y-8', className)}>
      <div className="space-y-6">
        {subtitle && (
          <p className="text-sm font-medium text-rausch-500 uppercase tracking-wide">
            {subtitle}
          </p>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight max-w-4xl">
          {title}
        </h1>
        {description && (
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
        <div className="flex flex-wrap gap-4">
          <Button asChild size="lg" className="group">
            <Link href={ctaLink}>
              {ctaText}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
      {images.length > 0 && (
        <div className="relative h-[300px] md:h-[400px]">
          <ImageCollage images={images} />
        </div>
      )}
    </div>
  )
}

/**
 * ImageCollage - Creates a Pinterest-style image grid
 */
function ImageCollage({ images }: { images: HeroImage[] }) {
  if (images.length === 0) return null

  // Layout patterns based on number of images
  if (images.length === 1) {
    return (
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl">
        <OptimizedImage
          src={images[0].src}
          alt={images[0].alt}
          fill
          className="object-cover"
          preset="hero"
        />
      </div>
    )
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-4 h-full">
        {images.map((image, idx) => (
          <div key={idx} className="relative rounded-2xl overflow-hidden shadow-lg">
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              preset="card"
            />
          </div>
        ))}
      </div>
    )
  }

  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-4 h-full">
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <OptimizedImage
            src={images[0].src}
            alt={images[0].alt}
            fill
            className="object-cover"
            preset="card"
          />
        </div>
        <div className="grid grid-rows-2 gap-4">
          {images.slice(1, 3).map((image, idx) => (
            <div key={idx} className="relative rounded-2xl overflow-hidden shadow-lg">
              <OptimizedImage
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                preset="thumbnail"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 4+ images: Complex grid layout
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-4 h-full">
      <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden shadow-xl">
        <OptimizedImage
          src={images[0].src}
          alt={images[0].alt}
          fill
          className="object-cover"
          preset="hero"
        />
      </div>
      {images.slice(1, 4).map((image, idx) => (
        <div key={idx} className="relative rounded-2xl overflow-hidden shadow-lg">
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
            preset="thumbnail"
          />
        </div>
      ))}
    </div>
  )
}

