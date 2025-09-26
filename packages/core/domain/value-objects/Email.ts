import { ValueObject } from '../base/ValueObject'
import { Result } from '../base/Result'

interface EmailProps {
  value: string
}

export class Email extends ValueObject<EmailProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: EmailProps) {
    super(props)
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  public static create(email: string): Result<Email> {
    if (!email || email.trim().length === 0) {
      return Result.fail<Email>('Email is required')
    }

    if (!this.isValidEmail(email)) {
      return Result.fail<Email>('Email format is invalid')
    }

    return Result.ok<Email>(new Email({ value: email.toLowerCase().trim() }))
  }
}
