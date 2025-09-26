import { injectable, inject } from 'inversify'
import { SupabaseClient } from '@supabase/supabase-js'
import { TripRepository } from '../../../packages/core/application/repositories/TripRepository'
import { Trip } from '../../../packages/core/domain/entities/Trip'
import { TripTitle } from '../../../packages/core/domain/value-objects/TripTitle'
import { TripSlug } from '../../../packages/core/domain/value-objects/TripSlug'
import { TripStatus } from '../../../packages/core/domain/value-objects/TripStatus'
import { DateRange } from '../../../packages/core/domain/value-objects/DateRange'
import { UniqueEntityID } from '../../../packages/core/domain/base/UniqueEntityID'
import { TYPES } from '../../../packages/core/application/types'

interface TripRow {
  id: string
  user_id: string
  title: string
  description?: string
  slug: string
  cover_image?: string
  start_date?: string
  end_date?: string
  status: string
  is_featured: boolean
  location_data?: any
  created_at: string
  updated_at: string
}

@injectable()
export class SupabaseTripRepository implements TripRepository {
  constructor(
    @inject(TYPES.Database) private supabase: SupabaseClient
  ) {}

  async save(trip: Trip): Promise<void> {
    const tripData: Omit<TripRow, 'created_at' | 'updated_at'> = {
      id: trip.id.toString(),
      user_id: trip.userId.toString(),
      title: trip.title.value,
      description: trip.description,
      slug: trip.slug.value,
      cover_image: trip.coverImage,
      start_date: trip.dateRange?.startDate.toISOString(),
      end_date: trip.dateRange?.endDate.toISOString(),
      status: trip.status.value,
      is_featured: trip.isFeatured,
      location_data: trip.locationData,
    }

    const { error } = await this.supabase
      .from('trips')
      .insert(tripData)

    if (error) {
      throw new Error(`Failed to save trip: ${error.message}`)
    }
  }

  async findById(id: UniqueEntityID): Promise<Trip | null> {
    const { data, error } = await this.supabase
      .from('trips')
      .select('*')
      .eq('id', id.toString())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to find trip by id: ${error.message}`)
    }

    return this.mapRowToTrip(data)
  }

  async findBySlug(slug: TripSlug): Promise<Trip | null> {
    const { data, error } = await this.supabase
      .from('trips')
      .select('*')
      .eq('slug', slug.value)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to find trip by slug: ${error.message}`)
    }

    return this.mapRowToTrip(data)
  }

  async findByUserId(userId: UniqueEntityID): Promise<Trip[]> {
    const { data, error } = await this.supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId.toString())
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find trips by user id: ${error.message}`)
    }

    return data.map(row => this.mapRowToTrip(row))
  }

  async findByUserIdAndTitle(userId: UniqueEntityID, title: TripTitle): Promise<Trip | null> {
    const { data, error } = await this.supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId.toString())
      .eq('title', title.value)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to find trip by user id and title: ${error.message}`)
    }

    return this.mapRowToTrip(data)
  }

  async update(trip: Trip): Promise<void> {
    const tripData: Partial<TripRow> = {
      title: trip.title.value,
      description: trip.description,
      slug: trip.slug.value,
      cover_image: trip.coverImage,
      start_date: trip.dateRange?.startDate.toISOString(),
      end_date: trip.dateRange?.endDate.toISOString(),
      status: trip.status.value,
      is_featured: trip.isFeatured,
      location_data: trip.locationData,
      updated_at: trip.updatedAt.toISOString(),
    }

    const { error } = await this.supabase
      .from('trips')
      .update(tripData)
      .eq('id', trip.id.toString())

    if (error) {
      throw new Error(`Failed to update trip: ${error.message}`)
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const { error } = await this.supabase
      .from('trips')
      .delete()
      .eq('id', id.toString())

    if (error) {
      throw new Error(`Failed to delete trip: ${error.message}`)
    }
  }

  async exists(id: UniqueEntityID): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('trips')
      .select('id')
      .eq('id', id.toString())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return false // Not found
      }
      throw new Error(`Failed to check trip existence: ${error.message}`)
    }

    return !!data
  }

  private mapRowToTrip(row: TripRow): Trip {
    const titleResult = TripTitle.create(row.title)
    if (titleResult.isFailure) {
      throw new Error(`Invalid title in database: ${row.title}`)
    }

    const statusResult = TripStatus.create(row.status)
    if (statusResult.isFailure) {
      throw new Error(`Invalid status in database: ${row.status}`)
    }

    let dateRange: DateRange | undefined
    if (row.start_date && row.end_date) {
      const dateRangeResult = DateRange.create(new Date(row.start_date), new Date(row.end_date))
      if (dateRangeResult.isFailure) {
        throw new Error(`Invalid date range in database: ${row.start_date} - ${row.end_date}`)
      }
      dateRange = dateRangeResult.getValue()
    }

    const tripResult = Trip.create({
      userId: new UniqueEntityID(row.user_id),
      title: titleResult.getValue(),
      description: row.description,
      dateRange,
    }, new UniqueEntityID(row.id))

    if (tripResult.isFailure) {
      throw new Error(`Failed to create trip from database row: ${tripResult.error}`)
    }

    const trip = tripResult.getValue()

    // Set additional properties
    if (row.cover_image) {
      trip.updateDetails({ coverImage: row.cover_image })
    }

    return trip
  }
}
