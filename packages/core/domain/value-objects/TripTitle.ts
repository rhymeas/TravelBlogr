import { ValueObject } from '../base/ValueObject'
import { Result } from '../base/Result'

interface TripTitleProps {
  value: string
}

export class TripTitle extends ValueObject<TripTitleProps> {
  public static minLength: number = 1
  public static maxLength: number = 100

  get value(): string {
    return this.props.value
  }

  private constructor(props: TripTitleProps) {
    super(props)
  }

  public static create(title: string): Result<TripTitle> {
    if (!title || title.trim().length === 0) {
      return Result.fail<TripTitle>('Trip title is required')
    }

    const trimmedTitle = title.trim()

    if (trimmedTitle.length < this.minLength) {
      return Result.fail<TripTitle>(`Trip title must be at least ${this.minLength} character`)
    }

    if (trimmedTitle.length > this.maxLength) {
      return Result.fail<TripTitle>(`Trip title must be no more than ${this.maxLength} characters`)
    }

    return Result.ok<TripTitle>(new TripTitle({ value: trimmedTitle }))
  }
}
