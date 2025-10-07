/**
 * UserLocation Entity
 * Represents a user's customization of a location
 * Domain-Driven Design: Entity with identity and business logic
 */

import { VisibilityLevel, VisibilityLevelType } from '../value-objects/VisibilityLevel'
import { UserRating } from '../value-objects/UserRating'

export interface UserLocationProps {
  id: string
  userId: string
  locationId: string
  personalNotes?: string
  userRating?: number
  isWishlisted: boolean
  isVisited: boolean
  visitDate?: Date
  visitCount: number
  visibility: VisibilityLevelType
  tags: string[]
  customData: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export class UserLocation {
  private constructor(private props: UserLocationProps) {}

  static create(props: Omit<UserLocationProps, 'id' | 'createdAt' | 'updatedAt'>): UserLocation {
    return new UserLocation({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  static fromPersistence(props: UserLocationProps): UserLocation {
    return new UserLocation(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get userId(): string {
    return this.props.userId
  }

  get locationId(): string {
    return this.props.locationId
  }

  get personalNotes(): string | undefined {
    return this.props.personalNotes
  }

  get userRating(): UserRating | undefined {
    return this.props.userRating ? UserRating.create(this.props.userRating) : undefined
  }

  get isWishlisted(): boolean {
    return this.props.isWishlisted
  }

  get isVisited(): boolean {
    return this.props.isVisited
  }

  get visitDate(): Date | undefined {
    return this.props.visitDate
  }

  get visitCount(): number {
    return this.props.visitCount
  }

  get visibility(): VisibilityLevel {
    return VisibilityLevel.create(this.props.visibility)
  }

  get tags(): string[] {
    return [...this.props.tags]
  }

  get customData(): Record<string, any> {
    return { ...this.props.customData }
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Business logic methods
  addToWishlist(): void {
    this.props.isWishlisted = true
    this.touch()
  }

  removeFromWishlist(): void {
    this.props.isWishlisted = false
    this.touch()
  }

  markAsVisited(visitDate?: Date): void {
    this.props.isVisited = true
    this.props.visitDate = visitDate || new Date()
    this.props.visitCount += 1
    this.touch()
  }

  markAsNotVisited(): void {
    this.props.isVisited = false
    this.props.visitDate = undefined
    this.touch()
  }

  updateNotes(notes: string): void {
    this.props.personalNotes = notes.trim()
    this.touch()
  }

  rate(rating: number): void {
    this.props.userRating = UserRating.create(rating).getValue()
    this.touch()
  }

  clearRating(): void {
    this.props.userRating = undefined
    this.touch()
  }

  setVisibility(visibility: VisibilityLevelType): void {
    this.props.visibility = visibility
    this.touch()
  }

  makePublic(): void {
    this.setVisibility('public')
  }

  makePrivate(): void {
    this.setVisibility('private')
  }

  addTag(tag: string): void {
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag)
      this.touch()
    }
  }

  removeTag(tag: string): void {
    this.props.tags = this.props.tags.filter(t => t !== tag)
    this.touch()
  }

  setCustomData(key: string, value: any): void {
    this.props.customData[key] = value
    this.touch()
  }

  getCustomData(key: string): any {
    return this.props.customData[key]
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  // Validation
  isOwnedBy(userId: string): boolean {
    return this.props.userId === userId
  }

  canBeViewedBy(userId: string): boolean {
    // Owner can always view
    if (this.isOwnedBy(userId)) {
      return true
    }

    // Public content can be viewed by anyone
    if (this.visibility.isPublic()) {
      return true
    }

    // TODO: Implement friends check when social features are ready
    if (this.visibility.isFriends()) {
      return false // For now, friends can't view
    }

    // Private content can only be viewed by owner
    return false
  }

  // Serialization
  toJSON(): UserLocationProps {
    return {
      ...this.props,
      tags: [...this.props.tags],
      customData: { ...this.props.customData }
    }
  }

  toPersistence(): Omit<UserLocationProps, 'createdAt' | 'updatedAt'> & {
    created_at: string
    updated_at: string
  } {
    return {
      id: this.props.id,
      userId: this.props.userId,
      locationId: this.props.locationId,
      personalNotes: this.props.personalNotes,
      userRating: this.props.userRating,
      isWishlisted: this.props.isWishlisted,
      isVisited: this.props.isVisited,
      visitDate: this.props.visitDate,
      visitCount: this.props.visitCount,
      visibility: this.props.visibility,
      tags: this.props.tags,
      customData: this.props.customData,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    }
  }
}

