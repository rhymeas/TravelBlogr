import { BaseDomainEvent } from '../base/DomainEvent'
import { UniqueEntityID } from '../base/UniqueEntityID'
import { Trip } from '../entities/Trip'

export class TripPublishedEvent extends BaseDomainEvent {
  public readonly trip: Trip

  constructor(trip: Trip) {
    super(trip.id)
    this.trip = trip
  }

  getAggregateId(): UniqueEntityID {
    return this.trip.id
  }
}
