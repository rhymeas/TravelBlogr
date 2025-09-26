import { UniqueEntityID } from './UniqueEntityID'

export interface DomainEvent {
  dateTimeOccurred: Date
  getAggregateId(): UniqueEntityID
}

export abstract class BaseDomainEvent implements DomainEvent {
  public dateTimeOccurred: Date
  
  constructor(public aggregateId: UniqueEntityID) {
    this.dateTimeOccurred = new Date()
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId
  }
}
