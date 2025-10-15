import { injectable, inject } from 'inversify'
import { Result } from '../../domain/base/Result'
import { User } from '../../domain/entities/User'
import { Email } from '../../domain/value-objects/Email'
import { UserName } from '../../domain/value-objects/UserName'
import type { UserRepository } from '../repositories/UserRepository'
import type { EventBus } from '../services/EventBus'
import { TYPES } from '../types'

export interface CreateUserCommand {
  email: string
  username?: string
  fullName?: string
}

export interface CreateUserResponse {
  user: User
}

@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {}

  public async execute(command: CreateUserCommand): Promise<Result<CreateUserResponse>> {
    try {
      // Validate email
      const emailResult = Email.create(command.email)
      if (emailResult.isFailure) {
        return Result.fail<CreateUserResponse>(emailResult.error || new Error('Invalid email'))
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(emailResult.getValue())
      if (existingUser) {
        return Result.fail<CreateUserResponse>(new Error('User with this email already exists'))
      }

      // Validate username if provided
      let username: UserName | undefined
      if (command.username) {
        const usernameResult = UserName.create(command.username)
        if (usernameResult.isFailure) {
          return Result.fail<CreateUserResponse>(usernameResult.error || new Error('Invalid username'))
        }
        username = usernameResult.getValue()

        // Check if username is already taken
        const existingUserByUsername = await this.userRepository.findByUsername(username)
        if (existingUserByUsername) {
          return Result.fail<CreateUserResponse>(new Error('Username is already taken'))
        }
      }

      // Create user
      const userResult = User.create({
        email: emailResult.getValue(),
        username,
        fullName: command.fullName
      })

      if (userResult.isFailure) {
        return Result.fail<CreateUserResponse>(userResult.error || new Error('Failed to create user'))
      }

      const user = userResult.getValue()

      // Save user
      await this.userRepository.save(user)

      // Publish domain events
      for (const event of user.domainEvents) {
        await this.eventBus.publish(event)
      }
      user.clearEvents()

      return Result.ok<CreateUserResponse>({ user })
    } catch (error) {
      return Result.fail<CreateUserResponse>(
        error instanceof Error ? error : new Error('An unexpected error occurred')
      )
    }
  }
}
