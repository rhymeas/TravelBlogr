/**
 * User Rating Value Object
 * Represents a user's rating of a location (0-5 stars)
 */

export class UserRating {
  private constructor(private readonly value: number) {
    if (value < 0 || value > 5) {
      throw new Error('Rating must be between 0 and 5')
    }
    // Round to 2 decimal places
    this.value = Math.round(value * 100) / 100
  }

  static create(value: number): UserRating {
    return new UserRating(value)
  }

  static fromStars(stars: number): UserRating {
    return new UserRating(stars)
  }

  getValue(): number {
    return this.value
  }

  getStars(): number {
    return Math.round(this.value)
  }

  isPositive(): boolean {
    return this.value >= 3
  }

  equals(other: UserRating): boolean {
    return this.value === other.value
  }

  toString(): string {
    return `${this.value}/5`
  }

  toJSON(): number {
    return this.value
  }
}

