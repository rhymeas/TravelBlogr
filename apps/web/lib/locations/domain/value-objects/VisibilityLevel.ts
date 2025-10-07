/**
 * Visibility Level Value Object
 * Represents the privacy level of user-generated content
 */

export type VisibilityLevelType = 'public' | 'private' | 'friends'

export class VisibilityLevel {
  private constructor(private readonly value: VisibilityLevelType) {}

  static PUBLIC = new VisibilityLevel('public')
  static PRIVATE = new VisibilityLevel('private')
  static FRIENDS = new VisibilityLevel('friends')

  static create(value: string): VisibilityLevel {
    switch (value.toLowerCase()) {
      case 'public':
        return VisibilityLevel.PUBLIC
      case 'private':
        return VisibilityLevel.PRIVATE
      case 'friends':
        return VisibilityLevel.FRIENDS
      default:
        throw new Error(`Invalid visibility level: ${value}`)
    }
  }

  getValue(): VisibilityLevelType {
    return this.value
  }

  isPublic(): boolean {
    return this.value === 'public'
  }

  isPrivate(): boolean {
    return this.value === 'private'
  }

  isFriends(): boolean {
    return this.value === 'friends'
  }

  equals(other: VisibilityLevel): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}

