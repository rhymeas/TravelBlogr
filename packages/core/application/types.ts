export const TYPES = {
  // Repositories
  UserRepository: Symbol.for('UserRepository'),
  TripRepository: Symbol.for('TripRepository'),
  PostRepository: Symbol.for('PostRepository'),
  ShareLinkRepository: Symbol.for('ShareLinkRepository'),
  MediaRepository: Symbol.for('MediaRepository'),

  // Services
  EventBus: Symbol.for('EventBus'),
  EmailService: Symbol.for('EmailService'),
  FileStorageService: Symbol.for('FileStorageService'),
  NotificationService: Symbol.for('NotificationService'),

  // Use Cases
  CreateUserUseCase: Symbol.for('CreateUserUseCase'),
  CreateTripUseCase: Symbol.for('CreateTripUseCase'),
  PublishTripUseCase: Symbol.for('PublishTripUseCase'),
  CreateShareLinkUseCase: Symbol.for('CreateShareLinkUseCase'),

  // Infrastructure
  Database: Symbol.for('Database'),
  Logger: Symbol.for('Logger'),
  Cache: Symbol.for('Cache'),
}
