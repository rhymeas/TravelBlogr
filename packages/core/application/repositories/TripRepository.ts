import { Trip } from '../../domain/entities/Trip'
import { TripTitle } from '../../domain/value-objects/TripTitle'
import { TripSlug } from '../../domain/value-objects/TripSlug'
import { UniqueEntityID } from '../../domain/base/UniqueEntityID'

export interface TripRepository {
  save(trip: Trip): Promise<void>
  findById(id: UniqueEntityID): Promise<Trip | null>
  findBySlug(slug: TripSlug): Promise<Trip | null>
  findByUserId(userId: UniqueEntityID): Promise<Trip[]>
  findByUserIdAndTitle(userId: UniqueEntityID, title: TripTitle): Promise<Trip | null>
  update(trip: Trip): Promise<void>
  delete(id: UniqueEntityID): Promise<void>
  exists(id: UniqueEntityID): Promise<boolean>
}
