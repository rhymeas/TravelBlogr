import { User } from '../../domain/entities/User'
import { Email } from '../../domain/value-objects/Email'
import { UserName } from '../../domain/value-objects/UserName'
import { UniqueEntityID } from '../../domain/base/UniqueEntityID'

export interface UserRepository {
  save(user: User): Promise<void>
  findById(id: UniqueEntityID): Promise<User | null>
  findByEmail(email: Email): Promise<User | null>
  findByUsername(username: UserName): Promise<User | null>
  update(user: User): Promise<void>
  delete(id: UniqueEntityID): Promise<void>
  exists(id: UniqueEntityID): Promise<boolean>
}
