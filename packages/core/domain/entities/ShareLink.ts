import { Entity } from '../base/Entity'
import { UniqueEntityID } from '../base/UniqueEntityID'
import { Result } from '../base/Result'
import { ShareLinkType } from '../value-objects/ShareLinkType'
import { ShareToken } from '../value-objects/ShareToken'

export interface ShareLinkProps {
  tripId: UniqueEntityID
  userId: UniqueEntityID
  linkType: ShareLinkType
  token: ShareToken
  title?: string
  description?: string
  password?: string
  expiresAt?: Date
  viewCount: number
  settings?: any // JSON data for share link settings
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class ShareLink extends Entity<ShareLinkProps> {
  get id(): UniqueEntityID {
    return this._id
  }

  get tripId(): UniqueEntityID {
    return this.props.tripId
  }

  get userId(): UniqueEntityID {
    return this.props.userId
  }

  get linkType(): ShareLinkType {
    return this.props.linkType
  }

  get token(): ShareToken {
    return this.props.token
  }

  get title(): string | undefined {
    return this.props.title
  }

  get description(): string | undefined {
    return this.props.description
  }

  get password(): string | undefined {
    return this.props.password
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt
  }

  get viewCount(): number {
    return this.props.viewCount
  }

  get settings(): any {
    return this.props.settings
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  public isExpired(): boolean {
    if (!this.props.expiresAt) return false
    return new Date() > this.props.expiresAt
  }

  public incrementViewCount(): Result<void> {
    this.props.viewCount += 1
    this.props.updatedAt = new Date()
    return Result.ok<void>()
  }

  public deactivate(): Result<void> {
    this.props.isActive = false
    this.props.updatedAt = new Date()
    return Result.ok<void>()
  }

  public activate(): Result<void> {
    this.props.isActive = true
    this.props.updatedAt = new Date()
    return Result.ok<void>()
  }

  public updateSettings(updates: {
    title?: string
    description?: string
    password?: string
    expiresAt?: Date
    settings?: any
  }): Result<void> {
    this.props.title = updates.title ?? this.props.title
    this.props.description = updates.description ?? this.props.description
    this.props.password = updates.password ?? this.props.password
    this.props.expiresAt = updates.expiresAt ?? this.props.expiresAt
    this.props.settings = updates.settings ?? this.props.settings
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public static create(props: {
    tripId: UniqueEntityID
    userId: UniqueEntityID
    linkType: ShareLinkType
    title?: string
    description?: string
    password?: string
    expiresAt?: Date
    settings?: any
  }, id?: UniqueEntityID): Result<ShareLink> {
    const tokenResult = ShareToken.create()
    if (tokenResult.isFailure) {
      return Result.fail<ShareLink>(tokenResult.error || new Error('Failed to create share token'))
    }

    const shareLinkProps: ShareLinkProps = {
      tripId: props.tripId,
      userId: props.userId,
      linkType: props.linkType,
      token: tokenResult.getValue(),
      title: props.title,
      description: props.description,
      password: props.password,
      expiresAt: props.expiresAt,
      viewCount: 0,
      settings: props.settings,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const shareLink = new ShareLink(shareLinkProps, id)

    return Result.ok<ShareLink>(shareLink)
  }
}
