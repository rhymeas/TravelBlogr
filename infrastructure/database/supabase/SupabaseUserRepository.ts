import { injectable, inject } from 'inversify'
import { SupabaseClient } from '@supabase/supabase-js'
import { UserRepository } from '../../../packages/core/application/repositories/UserRepository'
import { User } from '../../../packages/core/domain/entities/User'
import { Email } from '../../../packages/core/domain/value-objects/Email'
import { UserName } from '../../../packages/core/domain/value-objects/UserName'
import { UniqueEntityID } from '../../../packages/core/domain/base/UniqueEntityID'
import { Result } from '../../../packages/core/domain/base/Result'
import { TYPES } from '../../../packages/core/application/types'

interface UserRow {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  bio?: string
  website?: string
  location?: string
  is_email_verified: boolean
  created_at: string
  updated_at: string
}

@injectable()
export class SupabaseUserRepository implements UserRepository {
  constructor(
    @inject(TYPES.Database) private supabase: SupabaseClient
  ) {}

  async save(user: User): Promise<void> {
    const userData: Omit<UserRow, 'created_at' | 'updated_at'> = {
      id: user.id.toString(),
      email: user.email.value,
      username: user.username?.value,
      full_name: user.fullName,
      avatar_url: user.avatarUrl,
      bio: user.bio,
      website: user.website,
      location: user.location,
      is_email_verified: user.isEmailVerified,
    }

    const { error } = await this.supabase
      .from('users')
      .insert(userData)

    if (error) {
      throw new Error(`Failed to save user: ${error.message}`)
    }
  }

  async findById(id: UniqueEntityID): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id.toString())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to find user by id: ${error.message}`)
    }

    return this.mapRowToUser(data)
  }

  async findByEmail(email: Email): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email.value)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to find user by email: ${error.message}`)
    }

    return this.mapRowToUser(data)
  }

  async findByUsername(username: UserName): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username.value)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to find user by username: ${error.message}`)
    }

    return this.mapRowToUser(data)
  }

  async update(user: User): Promise<void> {
    const userData: Partial<UserRow> = {
      email: user.email.value,
      username: user.username?.value,
      full_name: user.fullName,
      avatar_url: user.avatarUrl,
      bio: user.bio,
      website: user.website,
      location: user.location,
      is_email_verified: user.isEmailVerified,
      updated_at: user.updatedAt.toISOString(),
    }

    const { error } = await this.supabase
      .from('users')
      .update(userData)
      .eq('id', user.id.toString())

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id.toString())

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }
  }

  async exists(id: UniqueEntityID): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('id', id.toString())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return false // Not found
      }
      throw new Error(`Failed to check user existence: ${error.message}`)
    }

    return !!data
  }

  private mapRowToUser(row: UserRow): User {
    const emailResult = Email.create(row.email)
    if (emailResult.isFailure) {
      throw new Error(`Invalid email in database: ${row.email}`)
    }

    let username: UserName | undefined
    if (row.username) {
      const usernameResult = UserName.create(row.username)
      if (usernameResult.isFailure) {
        throw new Error(`Invalid username in database: ${row.username}`)
      }
      username = usernameResult.getValue()
    }

    const userResult = User.create({
      email: emailResult.getValue(),
      username,
      fullName: row.full_name,
    }, new UniqueEntityID(row.id))

    if (userResult.isFailure) {
      throw new Error(`Failed to create user from database row: ${userResult.error}`)
    }

    const user = userResult.getValue()
    
    // Set additional properties that aren't part of the create method
    if (row.avatar_url) {
      user.updateProfile({ avatarUrl: row.avatar_url })
    }
    if (row.bio) {
      user.updateProfile({ bio: row.bio })
    }
    if (row.website) {
      user.updateProfile({ website: row.website })
    }
    if (row.location) {
      user.updateProfile({ location: row.location })
    }
    if (row.is_email_verified) {
      user.verifyEmail()
    }

    return user
  }
}
