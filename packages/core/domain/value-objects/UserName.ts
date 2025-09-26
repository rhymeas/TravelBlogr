import { ValueObject } from '../base/ValueObject'
import { Result } from '../base/Result'

interface UserNameProps {
  value: string
}

export class UserName extends ValueObject<UserNameProps> {
  public static minLength: number = 2
  public static maxLength: number = 30

  get value(): string {
    return this.props.value
  }

  private constructor(props: UserNameProps) {
    super(props)
  }

  private static isValidUsername(username: string): boolean {
    // Username can contain letters, numbers, underscores, and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    return usernameRegex.test(username)
  }

  public static create(username: string): Result<UserName> {
    if (!username || username.trim().length === 0) {
      return Result.fail<UserName>('Username is required')
    }

    const trimmedUsername = username.trim()

    if (trimmedUsername.length < this.minLength) {
      return Result.fail<UserName>(`Username must be at least ${this.minLength} characters`)
    }

    if (trimmedUsername.length > this.maxLength) {
      return Result.fail<UserName>(`Username must be no more than ${this.maxLength} characters`)
    }

    if (!this.isValidUsername(trimmedUsername)) {
      return Result.fail<UserName>('Username can only contain letters, numbers, underscores, and hyphens')
    }

    return Result.ok<UserName>(new UserName({ value: trimmedUsername.toLowerCase() }))
  }
}
