import { ValueObject } from '../base/ValueObject'
import { Result } from '../base/Result'
import { nanoid } from 'nanoid'

interface ShareTokenProps {
  value: string
}

export class ShareToken extends ValueObject<ShareTokenProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: ShareTokenProps) {
    super(props)
  }

  private static generateToken(): string {
    return nanoid(32) // Generate a 32-character token
  }

  private static isValidToken(token: string): boolean {
    // Token should be alphanumeric and of reasonable length
    const tokenRegex = /^[a-zA-Z0-9_-]+$/
    return tokenRegex.test(token) && token.length >= 16 && token.length <= 64
  }

  public static create(token?: string): Result<ShareToken> {
    const tokenValue = token || this.generateToken()

    if (!this.isValidToken(tokenValue)) {
      return Result.fail<ShareToken>('Invalid token format')
    }

    return Result.ok<ShareToken>(new ShareToken({ value: tokenValue }))
  }
}
