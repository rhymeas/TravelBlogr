import { UniqueEntityID } from './UniqueEntityID'

const isEntity = (v: any): v is Entity<any> => {
  return v instanceof Entity
}

export abstract class Entity<T> {
  protected readonly _id: UniqueEntityID
  protected props: T
  protected _domainEvents: any[] = [] // Can be overridden in subclasses

  constructor(props: T, id?: UniqueEntityID) {
    this._id = id ? id : new UniqueEntityID()
    this.props = props
  }

  public get domainEvents(): any[] {
    return this._domainEvents
  }

  public addDomainEvent(event: any): void {
    this._domainEvents.push(event)
  }

  public clearEvents(): void {
    this._domainEvents = []
  }

  public equals(object?: Entity<T>): boolean {
    if (object == null || object == undefined) {
      return false
    }

    if (this === object) {
      return true
    }

    if (!isEntity(object)) {
      return false
    }

    return this._id.equals(object._id)
  }
}
