import { ValueObject } from '../base/ValueObject'
import { Result } from '../base/Result'

type TripStatusValue = 'draft' | 'published' | 'archived'

interface TripStatusProps {
  value: TripStatusValue
}

export class TripStatus extends ValueObject<TripStatusProps> {
  public static readonly DRAFT = 'draft'
  public static readonly PUBLISHED = 'published'
  public static readonly ARCHIVED = 'archived'

  get value(): TripStatusValue {
    return this.props.value
  }

  private constructor(props: TripStatusProps) {
    super(props)
  }

  public isDraft(): boolean {
    return this.props.value === TripStatus.DRAFT
  }

  public isPublished(): boolean {
    return this.props.value === TripStatus.PUBLISHED
  }

  public isArchived(): boolean {
    return this.props.value === TripStatus.ARCHIVED
  }

  private static isValidStatus(status: string): status is TripStatusValue {
    return [TripStatus.DRAFT, TripStatus.PUBLISHED, TripStatus.ARCHIVED].includes(status as TripStatusValue)
  }

  public static create(status: string): Result<TripStatus> {
    if (!status || status.trim().length === 0) {
      return Result.fail<TripStatus>('Trip status is required')
    }

    const trimmedStatus = status.trim().toLowerCase()

    if (!this.isValidStatus(trimmedStatus)) {
      return Result.fail<TripStatus>('Invalid trip status. Must be draft, published, or archived')
    }

    return Result.ok<TripStatus>(new TripStatus({ value: trimmedStatus }))
  }
}
