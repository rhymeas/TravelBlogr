import { Entity } from '../base/Entity'
import { UniqueEntityID } from '../base/UniqueEntityID'
import { Result } from '../base/Result'
import { Email } from '../value-objects/Email'
import { UserName } from '../value-objects/UserName'
import { UserCreatedEvent } from '../events/UserCreatedEvent'

export interface UserProps {
  email: Email
  username?: UserName
  fullName?: string
  avatarUrl?: string
  bio?: string
  website?: string
  location?: string
  isEmailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export class User extends Entity<UserProps> {
  get id(): UniqueEntityID {
    return this._id
  }

  get email(): Email {
    return this.props.email
  }

  get username(): UserName | undefined {
    return this.props.username
  }

  get fullName(): string | undefined {
    return this.props.fullName
  }

  get avatarUrl(): string | undefined {
    return this.props.avatarUrl
  }

  get bio(): string | undefined {
    return this.props.bio
  }

  get website(): string | undefined {
    return this.props.website
  }

  get location(): string | undefined {
    return this.props.location
  }

  get isEmailVerified(): boolean {
    return this.props.isEmailVerified
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  public updateProfile(updates: {
    fullName?: string
    bio?: string
    website?: string
    location?: string
  }): Result<void> {
    this.props.fullName = updates.fullName ?? this.props.fullName
    this.props.bio = updates.bio ?? this.props.bio
    this.props.website = updates.website ?? this.props.website
    this.props.location = updates.location ?? this.props.location
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public setUsername(username: UserName): Result<void> {
    this.props.username = username
    this.props.updatedAt = new Date()
    return Result.ok<void>()
  }

  public verifyEmail(): Result<void> {
    if (this.props.isEmailVerified) {
      return Result.fail<void>(new Error('Email is already verified'))
    }

    this.props.isEmailVerified = true
    this.props.updatedAt = new Date()
    return Result.ok<void>()
  }

  public static create(props: {
    email: Email
    username?: UserName
    fullName?: string
  }, id?: UniqueEntityID): Result<User> {
    const userProps: UserProps = {
      email: props.email,
      username: props.username,
      fullName: props.fullName,
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const user = new User(userProps, id)
    
    // Add domain event
    user.addDomainEvent(new UserCreatedEvent(user))

    return Result.ok<User>(user)
  }
}
