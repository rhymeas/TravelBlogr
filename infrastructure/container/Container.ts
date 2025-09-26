import 'reflect-metadata'
import { Container } from 'inversify'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Core Application
import { TYPES } from '../../packages/core/application/types'
import { UserRepository } from '../../packages/core/application/repositories/UserRepository'
import { TripRepository } from '../../packages/core/application/repositories/TripRepository'
import { EventBus } from '../../packages/core/application/services/EventBus'
import { CreateUserUseCase } from '../../packages/core/application/use-cases/CreateUserUseCase'
import { CreateTripUseCase } from '../../packages/core/application/use-cases/CreateTripUseCase'

// Infrastructure
import { SupabaseUserRepository } from '../database/supabase/SupabaseUserRepository'
import { SupabaseTripRepository } from '../database/supabase/SupabaseTripRepository'
import { InMemoryEventBus } from '../services/InMemoryEventBus'

const container = new Container()

// Database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)
container.bind<SupabaseClient>(TYPES.Database).toConstantValue(supabase)

// Repositories
container.bind<UserRepository>(TYPES.UserRepository).to(SupabaseUserRepository)
container.bind<TripRepository>(TYPES.TripRepository).to(SupabaseTripRepository)

// Services
container.bind<EventBus>(TYPES.EventBus).to(InMemoryEventBus).inSingletonScope()

// Use Cases
container.bind<CreateUserUseCase>(TYPES.CreateUserUseCase).to(CreateUserUseCase)
container.bind<CreateTripUseCase>(TYPES.CreateTripUseCase).to(CreateTripUseCase)

export { container }
