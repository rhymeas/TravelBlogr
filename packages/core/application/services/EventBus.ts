import { DomainEvent } from '../../domain/base/DomainEvent'

export interface EventBus {
  publish(event: DomainEvent): Promise<void>
  subscribe<T extends DomainEvent>(eventType: string, handler: (event: T) => Promise<void>): void
}
