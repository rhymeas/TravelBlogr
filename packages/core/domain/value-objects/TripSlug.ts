import { ValueObject } from '../base/ValueObject'
import { Result } from '../base/Result'

interface TripSlugProps {
  value: string
}

export class TripSlug extends ValueObject<TripSlugProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: TripSlugProps) {
    super(props)
  }

  private static createSlugFromText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  }

  public static create(text: string): Result<TripSlug> {
    if (!text || text.trim().length === 0) {
      return Result.fail<TripSlug>('Text is required to create slug')
    }

    const slug = this.createSlugFromText(text.trim())

    if (slug.length === 0) {
      return Result.fail<TripSlug>('Unable to create valid slug from provided text')
    }

    return Result.ok<TripSlug>(new TripSlug({ value: slug }))
  }

  public static createFromSlug(slug: string): Result<TripSlug> {
    if (!slug || slug.trim().length === 0) {
      return Result.fail<TripSlug>('Slug is required')
    }

    const trimmedSlug = slug.trim().toLowerCase()

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(trimmedSlug)) {
      return Result.fail<TripSlug>('Slug can only contain lowercase letters, numbers, and hyphens')
    }

    return Result.ok<TripSlug>(new TripSlug({ value: trimmedSlug }))
  }
}
