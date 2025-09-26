import { injectable } from 'inversify'
import { EventBus } from '../../packages/core/application/services/EventBus'
import { DomainEvent } from '../../packages/core/domain/base/DomainEvent'

type EventHandler<T extends DomainEvent> = (event: T) => Promise<void>

@injectable()
export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler<any>[]> = new Map()

  async publish(event: DomainEvent): Promise<void> {
    const eventType = event.constructor.name
    const handlers = this.handlers.get(eventType) || []

    // Execute all handlers for this event type
    await Promise.all(handlers.map(handler => handler(event)))
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }

    this.handlers.get(eventType)!.push(handler)
  }
}
