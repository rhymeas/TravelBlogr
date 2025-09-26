import { ValueObject } from '../base/ValueObject'
import { Result } from '../base/Result'

interface DateRangeProps {
  startDate: Date
  endDate: Date
}

export class DateRange extends ValueObject<DateRangeProps> {
  get startDate(): Date {
    return this.props.startDate
  }

  get endDate(): Date {
    return this.props.endDate
  }

  private constructor(props: DateRangeProps) {
    super(props)
  }

  public getDurationInDays(): number {
    const timeDiff = this.props.endDate.getTime() - this.props.startDate.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  public contains(date: Date): boolean {
    return date >= this.props.startDate && date <= this.props.endDate
  }

  public overlaps(other: DateRange): boolean {
    return this.props.startDate <= other.endDate && this.props.endDate >= other.startDate
  }

  public static create(startDate: Date, endDate: Date): Result<DateRange> {
    if (!startDate || !endDate) {
      return Result.fail<DateRange>('Both start date and end date are required')
    }

    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      return Result.fail<DateRange>('Invalid date objects provided')
    }

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return Result.fail<DateRange>('Invalid date values provided')
    }

    if (startDate > endDate) {
      return Result.fail<DateRange>('Start date must be before or equal to end date')
    }

    return Result.ok<DateRange>(new DateRange({ startDate, endDate }))
  }

  public static createFromStrings(startDateStr: string, endDateStr: string): Result<DateRange> {
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    return this.create(startDate, endDate)
  }
}
