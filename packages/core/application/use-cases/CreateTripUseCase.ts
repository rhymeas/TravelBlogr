import { injectable, inject } from 'inversify'
import { Result } from '../../domain/base/Result'
import { UniqueEntityID } from '../../domain/base/UniqueEntityID'
import { Trip } from '../../domain/entities/Trip'
import { TripTitle } from '../../domain/value-objects/TripTitle'
import { DateRange } from '../../domain/value-objects/DateRange'
import { TripRepository } from '../repositories/TripRepository'
import { UserRepository } from '../repositories/UserRepository'
import { EventBus } from '../services/EventBus'
import { TYPES } from '../types'

export interface CreateTripCommand {
  userId: string
  title: string
  description?: string
  startDate?: string
  endDate?: string
}

export interface CreateTripResponse {
  trip: Trip
}

@injectable()
export class CreateTripUseCase {
  constructor(
    @inject(TYPES.TripRepository) private tripRepository: TripRepository,
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {}

  public async execute(command: CreateTripCommand): Promise<Result<CreateTripResponse>> {
    try {
      // Validate user exists
      const userId = new UniqueEntityID(command.userId)
      const user = await this.userRepository.findById(userId)
      if (!user) {
        return Result.fail<CreateTripResponse>(new Error('User not found'))
      }

      // Validate title
      const titleResult = TripTitle.create(command.title)
      if (titleResult.isFailure) {
        return Result.fail<CreateTripResponse>(titleResult.error)
      }

      // Validate date range if provided
      let dateRange: DateRange | undefined
      if (command.startDate && command.endDate) {
        const dateRangeResult = DateRange.createFromStrings(command.startDate, command.endDate)
        if (dateRangeResult.isFailure) {
          return Result.fail<CreateTripResponse>(dateRangeResult.error)
        }
        dateRange = dateRangeResult.getValue()
      }

      // Check if user already has a trip with the same title
      const existingTrip = await this.tripRepository.findByUserIdAndTitle(userId, titleResult.getValue())
      if (existingTrip) {
        return Result.fail<CreateTripResponse>(new Error('You already have a trip with this title'))
      }

      // Create trip
      const tripResult = Trip.create({
        userId,
        title: titleResult.getValue(),
        description: command.description,
        dateRange
      })

      if (tripResult.isFailure) {
        return Result.fail<CreateTripResponse>(tripResult.error)
      }

      const trip = tripResult.getValue()

      // Save trip
      await this.tripRepository.save(trip)

      // Publish domain events
      for (const event of trip.domainEvents) {
        await this.eventBus.publish(event)
      }
      trip.clearEvents()

      return Result.ok<CreateTripResponse>({ trip })
    } catch (error) {
      return Result.fail<CreateTripResponse>(
        error instanceof Error ? error : new Error('An unexpected error occurred')
      )
    }
  }
}
