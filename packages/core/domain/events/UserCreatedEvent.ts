import { BaseDomainEvent } from '../base/DomainEvent'
import { UniqueEntityID } from '../base/UniqueEntityID'
import { User } from '../entities/User'

export class UserCreatedEvent extends BaseDomainEvent {
  public readonly user: User

  constructor(user: User) {
    super(user.id)
    this.user = user
  }

  getAggregateId(): UniqueEntityID {
    return this.user.id
  }
}
