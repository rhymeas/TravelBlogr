/**
 * TripLocationCustomization Entity
 * Represents trip-specific customizations for a location
 * Allows users to override location details within their own trips
 */

export interface TripLocationCustomizationProps {
  id: string
  tripId: string
  locationId: string
  userId: string
  customName?: string
  customDescription?: string
  customNotes?: string
  customImages: string[]
  arrivalTime?: Date
  departureTime?: Date
  durationMinutes?: number
  estimatedCost?: number
  actualCost?: number
  currency?: string
  isPublic: boolean
  orderIndex: number
  customData: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export class TripLocationCustomization {
  private constructor(private props: TripLocationCustomizationProps) {}

  static create(
    props: Omit<TripLocationCustomizationProps, 'id' | 'createdAt' | 'updatedAt'>
  ): TripLocationCustomization {
    return new TripLocationCustomization({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  static fromPersistence(props: TripLocationCustomizationProps): TripLocationCustomization {
    return new TripLocationCustomization(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get tripId(): string {
    return this.props.tripId
  }

  get locationId(): string {
    return this.props.locationId
  }

  get userId(): string {
    return this.props.userId
  }

  get customName(): string | undefined {
    return this.props.customName
  }

  get customDescription(): string | undefined {
    return this.props.customDescription
  }

  get customNotes(): string | undefined {
    return this.props.customNotes
  }

  get customImages(): string[] {
    return [...this.props.customImages]
  }

  get arrivalTime(): Date | undefined {
    return this.props.arrivalTime
  }

  get departureTime(): Date | undefined {
    return this.props.departureTime
  }

  get durationMinutes(): number | undefined {
    return this.props.durationMinutes
  }

  get estimatedCost(): number | undefined {
    return this.props.estimatedCost
  }

  get actualCost(): number | undefined {
    return this.props.actualCost
  }

  get currency(): string | undefined {
    return this.props.currency
  }

  get isPublic(): boolean {
    return this.props.isPublic
  }

  get orderIndex(): number {
    return this.props.orderIndex
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
  setCustomName(name: string): void {
    this.props.customName = name.trim()
    this.touch()
  }

  clearCustomName(): void {
    this.props.customName = undefined
    this.touch()
  }

  setCustomDescription(description: string): void {
    this.props.customDescription = description.trim()
    this.touch()
  }

  updateNotes(notes: string): void {
    this.props.customNotes = notes.trim()
    this.touch()
  }

  addImage(imageUrl: string): void {
    if (!this.props.customImages.includes(imageUrl)) {
      this.props.customImages.push(imageUrl)
      this.touch()
    }
  }

  removeImage(imageUrl: string): void {
    this.props.customImages = this.props.customImages.filter(img => img !== imageUrl)
    this.touch()
  }

  setArrivalTime(time: Date): void {
    this.props.arrivalTime = time
    this.calculateDuration()
    this.touch()
  }

  setDepartureTime(time: Date): void {
    this.props.departureTime = time
    this.calculateDuration()
    this.touch()
  }

  private calculateDuration(): void {
    if (this.props.arrivalTime && this.props.departureTime) {
      const diff = this.props.departureTime.getTime() - this.props.arrivalTime.getTime()
      this.props.durationMinutes = Math.round(diff / (1000 * 60))
    }
  }

  setDuration(minutes: number): void {
    this.props.durationMinutes = minutes
    this.touch()
  }

  setEstimatedCost(cost: number, currency: string): void {
    this.props.estimatedCost = cost
    this.props.currency = currency
    this.touch()
  }

  setActualCost(cost: number, currency?: string): void {
    this.props.actualCost = cost
    if (currency) {
      this.props.currency = currency
    }
    this.touch()
  }

  makePublic(): void {
    this.props.isPublic = true
    this.touch()
  }

  makePrivate(): void {
    this.props.isPublic = false
    this.touch()
  }

  setOrderIndex(index: number): void {
    this.props.orderIndex = index
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

  belongsToTrip(tripId: string): boolean {
    return this.props.tripId === tripId
  }

  canBeViewedBy(userId: string, tripOwnerId: string): boolean {
    // Owner can always view
    if (this.isOwnedBy(userId)) {
      return true
    }

    // Trip owner can view
    if (tripOwnerId === userId) {
      return true
    }

    // Public customizations can be viewed by anyone
    if (this.props.isPublic) {
      return true
    }

    return false
  }

  // Calculated properties
  getCostVariance(): number | undefined {
    if (this.props.estimatedCost !== undefined && this.props.actualCost !== undefined) {
      return this.props.actualCost - this.props.estimatedCost
    }
    return undefined
  }

  isOverBudget(): boolean {
    const variance = this.getCostVariance()
    return variance !== undefined && variance > 0
  }

  isUnderBudget(): boolean {
    const variance = this.getCostVariance()
    return variance !== undefined && variance < 0
  }

  // Serialization
  toJSON(): TripLocationCustomizationProps {
    return {
      ...this.props,
      customImages: [...this.props.customImages],
      customData: { ...this.props.customData }
    }
  }

  toPersistence(): Omit<TripLocationCustomizationProps, 'createdAt' | 'updatedAt'> & {
    created_at: string
    updated_at: string
  } {
    return {
      id: this.props.id,
      tripId: this.props.tripId,
      locationId: this.props.locationId,
      userId: this.props.userId,
      customName: this.props.customName,
      customDescription: this.props.customDescription,
      customNotes: this.props.customNotes,
      customImages: this.props.customImages,
      arrivalTime: this.props.arrivalTime,
      departureTime: this.props.departureTime,
      durationMinutes: this.props.durationMinutes,
      estimatedCost: this.props.estimatedCost,
      actualCost: this.props.actualCost,
      currency: this.props.currency,
      isPublic: this.props.isPublic,
      orderIndex: this.props.orderIndex,
      customData: this.props.customData,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    }
  }
}

