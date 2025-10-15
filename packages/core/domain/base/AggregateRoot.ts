import { Entity } from './Entity'
import { DomainEvent } from './DomainEvent'
import { UniqueEntityID } from './UniqueEntityID'

export abstract class AggregateRoot<T> extends Entity<T> {
  // _domainEvents is inherited from Entity

  get id(): UniqueEntityID {
    return this._id
  }

  get domainEvents(): DomainEvent[] {
    return this._domainEvents as DomainEvent[]
  }

  public addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent)
  }

  public clearEvents(): void {
    this._domainEvents.splice(0, this._domainEvents.length)
  }
}
