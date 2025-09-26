import { ValueObject } from '../base/ValueObject'
import { Result } from '../base/Result'

type ShareLinkTypeValue = 'public' | 'family' | 'friends' | 'professional'

interface ShareLinkTypeProps {
  value: ShareLinkTypeValue
}

export class ShareLinkType extends ValueObject<ShareLinkTypeProps> {
  public static readonly PUBLIC = 'public'
  public static readonly FAMILY = 'family'
  public static readonly FRIENDS = 'friends'
  public static readonly PROFESSIONAL = 'professional'

  get value(): ShareLinkTypeValue {
    return this.props.value
  }

  private constructor(props: ShareLinkTypeProps) {
    super(props)
  }

  public isPublic(): boolean {
    return this.props.value === ShareLinkType.PUBLIC
  }

  public isFamily(): boolean {
    return this.props.value === ShareLinkType.FAMILY
  }

  public isFriends(): boolean {
    return this.props.value === ShareLinkType.FRIENDS
  }

  public isProfessional(): boolean {
    return this.props.value === ShareLinkType.PROFESSIONAL
  }

  private static isValidType(type: string): type is ShareLinkTypeValue {
    return [
      ShareLinkType.PUBLIC,
      ShareLinkType.FAMILY,
      ShareLinkType.FRIENDS,
      ShareLinkType.PROFESSIONAL
    ].includes(type as ShareLinkTypeValue)
  }

  public static create(type: string): Result<ShareLinkType> {
    if (!type || type.trim().length === 0) {
      return Result.fail<ShareLinkType>('Share link type is required')
    }

    const trimmedType = type.trim().toLowerCase()

    if (!this.isValidType(trimmedType)) {
      return Result.fail<ShareLinkType>('Invalid share link type. Must be public, family, friends, or professional')
    }

    return Result.ok<ShareLinkType>(new ShareLinkType({ value: trimmedType }))
  }
}
