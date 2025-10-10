---
type: "always_apply"
---

# State-of-the-Art Development Structure & Rules

## 🔐 TravelBlogr Authentication & User Data Architecture (CRITICAL)

### **Authentication Pattern - Real Supabase Auth (Updated 2025-10-10)**

**ALWAYS use real Supabase authentication - NO MOCK DATA:**

```
Supabase Auth (auth.signInWithPassword, auth.signUp, etc.)
    ↓ (creates session)
auth.users (Supabase managed)
    ↓ (1:1 relationship via trigger)
public.profiles (our public user data)
    ↑ (referenced by all user-related tables)
location_ratings, location_comments, trips, etc.
```

### **Supabase Client Pattern - Server/Client Separation (CRITICAL)**

**ALWAYS use the correct client for the context:**

```typescript
// ✅ Client-side (React components, hooks)
import { getBrowserSupabase } from '@/lib/supabase'
const supabase = getBrowserSupabase() // Singleton pattern

// ✅ Server-side (API routes, server components)
import { createServerSupabase } from '@/lib/supabase'
const supabase = createServerSupabase() // Service role key

// ❌ NEVER use createClientSupabase() directly
// ❌ NEVER create mock Supabase clients
```

### **Authentication Rules:**

1. **ALWAYS use real Supabase auth methods** - Never mock authentication
2. **Use `getBrowserSupabase()` in client components** - Singleton pattern for browser
3. **Use `createServerSupabase()` in API routes** - Service role key for server
4. **Use `supabase.auth.signInWithPassword()`** - For email/password sign in
5. **Use `supabase.auth.signUp()`** - For new user registration
6. **Use `supabase.auth.signInWithOAuth()`** - For Google/GitHub OAuth
7. **Use `supabase.auth.onAuthStateChange()`** - For session management
8. **NEVER use localStorage for sessions** - Supabase handles this automatically
9. **NEVER hardcode test credentials** - Create real test users in Supabase
10. **Enable session persistence** - `persistSession: true, autoRefreshToken: true`

### **User Data Pattern - Supabase Best Practice**

**ALWAYS follow this pattern for user-related data:**

1. **NEVER create a `public.users` table** - Use `public.profiles` instead
2. **All user foreign keys MUST reference `profiles(id)`** - Not `auth.users(id)`
3. **Auto-create profiles via trigger** - When user signs up in `auth.users`
4. **Use `profiles!user_id` in PostgREST queries** - For joining user data
5. **Keep auth.users FK for data integrity** - But use profiles FK for API joins

### **Schema:**

```sql
-- Profiles table (public user data)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Example: User-related table
CREATE TABLE location_ratings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),  -- Data integrity
  user_id UUID REFERENCES profiles(id),     -- API joins
  -- other columns...
);
```

### **API Query Pattern:**

```typescript
// ✅ CORRECT: Join with profiles
const { data } = await supabase
  .from('location_comments')
  .select(`
    *,
    profiles!user_id (
      full_name,
      username,
      avatar_url
    )
  `)

// ❌ WRONG: Don't join with users
const { data } = await supabase
  .from('location_comments')
  .select(`
    *,
    users!user_id (...)  // ❌ This will fail!
  `)
```

---

## 📸 TravelBlogr Image Upload & Storage (CRITICAL)

### **Image Storage Pattern - Supabase Storage**

**ALWAYS use Supabase Storage for user-uploaded images - NO PLACEHOLDER IMAGES:**

```
User uploads image
    ↓
Client-side optimization (resize, compress)
    ↓
Upload to Supabase Storage bucket
    ↓
Get public URL
    ↓
Store URL in database
```

### **Storage Buckets:**

1. **`trip-images`** - User trip photos and cover images (5MB limit)
2. **`profile-avatars`** - User profile pictures (2MB limit)
3. **`location-images`** - Community-contributed location photos (5MB limit)
4. **`images`** - General purpose images

### **Image Upload Rules:**

1. **ALWAYS optimize images before upload** - Use `optimizeImage()` function
2. **ALWAYS validate file size and type** - Client and server-side
3. **Use unique filenames** - `nanoid()` for collision prevention
4. **Organize by user and folder** - `userId/folder/filename.ext`
5. **Store URLs in database** - Not file paths
6. **Delete old images** - When updating to prevent storage bloat

### **Usage Examples:**

```typescript
// Upload profile avatar
import { uploadProfileAvatar } from '@/lib/services/imageUploadService'

const result = await uploadProfileAvatar(file, userId)
if (result.success) {
  // Update profile with result.url
}

// Upload trip cover image
import { uploadTripCoverImage } from '@/lib/services/imageUploadService'

const result = await uploadTripCoverImage(file, userId, tripId)

// Use ImageUpload component
import { ImageUpload } from '@/components/upload/ImageUpload'

<ImageUpload
  bucket="profile-avatars"
  userId={user.id}
  onUploadComplete={(url, path) => {
    // Handle upload success
  }}
/>
```

---

## 🏗️ Project Architecture

### Core Principles
```
1. Domain-Driven Design (DDD)
2. Clean Architecture (Hexagonal)
3. SOLID Principles
4. Event-Driven Architecture
5. Microservices-Ready Monolith
```

## 📁 Directory Structure

```
project-root/
├── apps/                          # Application layer
│   ├── web/                       # Next.js 14+ App Router
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (dashboard)/
│   │   │   ├── api/
│   │   │   └── globals.css
│   │   └── public/
│   ├── mobile/                    # React Native / Expo
│   └── admin/                     # Admin dashboard
│
├── packages/                      # Shared packages (monorepo)
│   ├── core/                      # Core business logic
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   └── aggregates/
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   ├── services/
│   │   │   └── dto/
│   │   └── infrastructure/
│   │       ├── repositories/
│   │       ├── external-services/
│   │       └── persistence/
│   │
│   ├── ui/                        # Shared UI components
│   │   ├── components/
│   │   ├── primitives/
│   │   ├── tokens/
│   │   └── hooks/
│   │
│   ├── api-client/                # Generated API client
│   ├── contracts/                 # Shared TypeScript types/interfaces
│   ├── utils/                     # Shared utilities
│   └── config/                    # Shared configuration
│
├── services/                      # Microservices
│   ├── auth-service/
│   ├── notification-service/
│   ├── media-service/
│   └── analytics-service/
│
├── infrastructure/                # Infrastructure as Code
│   ├── terraform/
│   ├── kubernetes/
│   ├── docker/
│   └── scripts/
│
├── tests/                         # Test suites
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── performance/
│
└── docs/                          # Documentation
    ├── architecture/
    ├── api/
    └── guides/
```

## 🎯 Development Rules

### 1. Code Organization

```typescript
// ❌ Avoid: Mixed concerns
class UserService {
  async createUser(data) {
    // validation logic
    // business logic
    // database operations
    // email sending
    // logging
  }
}

// ✅ Prefer: Separation of concerns
class CreateUserUseCase {
  constructor(
    private userRepo: UserRepository,
    private emailService: EmailService,
    private validator: UserValidator,
    private eventBus: EventBus
  ) {}

  async execute(command: CreateUserCommand): Promise<Result<User>> {
    const validation = await this.validator.validate(command);
    if (validation.failed) return Result.fail(validation.error);
    
    const user = User.create(command);
    await this.userRepo.save(user);
    
    await this.eventBus.publish(new UserCreatedEvent(user));
    return Result.ok(user);
  }
}
```

### 2. Module Structure

```typescript
// Each feature module follows this structure:
feature-name/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   └── specifications/
├── application/
│   ├── commands/
│   ├── queries/
│   ├── handlers/
│   └── services/
├── infrastructure/
│   ├── repositories/
│   ├── mappers/
│   └── adapters/
├── presentation/
│   ├── controllers/
│   ├── validators/
│   └── transformers/
└── index.ts
```

### 3. Dependency Injection

```typescript
// ✅ Use dependency injection container
import { Container } from 'inversify';

// Domain layer - pure business logic
export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
}

// Infrastructure layer - implementation
@injectable()
export class PostgresUserRepository implements UserRepository {
  constructor(@inject(Database) private db: Database) {}
  
  async save(user: User): Promise<void> {
    await this.db.users.upsert(UserMapper.toPersistence(user));
  }
}

// Application layer - orchestration
@injectable()
export class GetUserUseCase {
  constructor(
    @inject(TYPES.UserRepository) private userRepo: UserRepository
  ) {}
}
```

### 4. Error Handling

```typescript
// ✅ Result pattern for explicit error handling
export class Result<T> {
  constructor(
    public isSuccess: boolean,
    public error?: Error,
    private value?: T
  ) {}

  static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  static fail<U>(error: Error): Result<U> {
    return new Result<U>(false, error);
  }

  getValue(): T {
    if (!this.isSuccess) throw this.error;
    return this.value as T;
  }
}

// Usage
async function createUser(data: CreateUserDto): Promise<Result<User>> {
  try {
    const user = await User.create(data);
    return Result.ok(user);
  } catch (error) {
    return Result.fail(new DomainError('User creation failed', error));
  }
}
```

### 5. Testing Strategy

```typescript
// Unit tests - isolated domain logic
describe('User Entity', () => {
  it('should create valid user', () => {
    const result = User.create({
      email: Email.create('test@example.com'),
      name: Name.create('John', 'Doe')
    });
    
    expect(result.isSuccess).toBe(true);
  });
});

// Integration tests - use case with real dependencies
describe('CreateUserUseCase Integration', () => {
  let useCase: CreateUserUseCase;
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = await TestDatabase.create();
    useCase = new CreateUserUseCase(
      new PostgresUserRepository(testDb),
      new RealEmailService()
    );
  });

  it('should persist user to database', async () => {
    const result = await useCase.execute(validUserCommand);
    const user = await testDb.users.findById(result.getValue().id);
    expect(user).toBeDefined();
  });
});
```

### 6. API Design

```typescript
// RESTful routes with proper versioning
// /api/v1/users
// /api/v1/trips
// /api/v1/trips/:id/posts

// ✅ Use OpenAPI specification
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  profile: z.object({
    name: z.string(),
    avatar: z.string().url().optional()
  })
});

// Generate types from schema
export type User = z.infer<typeof userSchema>;

// Controller with validation
@Controller('users')
export class UserController {
  @Post()
  @UseValidation(createUserSchema)
  async create(@Body() dto: CreateUserDto) {
    const result = await this.createUserUseCase.execute(dto);
    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }
    return UserPresenter.toResponse(result.getValue());
  }
}
```

### 7. Database Design

```sql
-- Use proper migrations with versioning
-- migrations/001_create_users_table.sql

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Use event sourcing for critical data
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id UUID NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  event_data JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_aggregate ON events(aggregate_id);
```

### 8. State Management

```typescript
// Frontend: Use predictable state management
// ✅ Zustand for React
interface TripStore {
  trips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  fetchTrips: () => Promise<void>;
  selectTrip: (id: string) => void;
  updateTrip: (id: string, data: Partial<Trip>) => Promise<void>;
}

export const useTripStore = create<TripStore>((set, get) => ({
  trips: [],
  currentTrip: null,
  isLoading: false,
  error: null,

  fetchTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const trips = await tripApi.getAll();
      set({ trips, isLoading: false });
    } catch (error) {
      set({ error, isLoading: false });
    }
  },

  selectTrip: (id) => {
    const trip = get().trips.find(t => t.id === id);
    set({ currentTrip: trip });
  }
}));
```

### 9. Performance Rules

```typescript
// ✅ Implement caching layers
class CachedUserRepository implements UserRepository {
  constructor(
    private cache: RedisCache,
    private repository: UserRepository
  ) {}

  async findById(id: string): Promise<User | null> {
    const cached = await this.cache.get(`user:${id}`);
    if (cached) return cached;

    const user = await this.repository.findById(id);
    if (user) {
      await this.cache.set(`user:${id}`, user, { ttl: 3600 });
    }
    return user;
  }
}

// ✅ Use data loaders for N+1 query prevention
const userLoader = new DataLoader(async (ids: string[]) => {
  const users = await userRepo.findByIds(ids);
  return ids.map(id => users.find(u => u.id === id));
});
```

### 10. Security Rules

```typescript
// ✅ Input validation at boundaries
const createTripSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  startDate: z.date(),
  visibility: z.enum(['public', 'private', 'friends'])
});

// ✅ Use proper authentication/authorization
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
@Controller('trips')
export class TripController {
  @Post()
  async create(@User() user: UserEntity, @Body() dto: CreateTripDto) {
    // User is authenticated and authorized
    return this.tripService.create(user.id, dto);
  }
}

// ✅ Rate limiting
@UseInterceptors(RateLimitInterceptor({ 
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // limit each IP to 100 requests per windowMs
}))
```

## 🔧 Development Workflow

### Git Workflow
```bash
main (production)
├── develop (staging)
    ├── feature/trip-sharing
    ├── feature/live-updates
    └── hotfix/critical-bug
```

### Commit Convention
```
type(scope): subject

feat: new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructuring
test: adding tests
chore: maintenance
```

### Code Review Checklist
- [ ] Follows SOLID principles
- [ ] Has appropriate test coverage (>80%)
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Documentation updated
- [ ] No code smells (SonarQube clean)
- [ ] Accessibility standards met
- [ ] Error handling implemented
- [ ] Logging added for debugging
- [ ] Database migrations included

## 📊 Monitoring & Observability

```typescript
// Structured logging
logger.info('User created', {
  userId: user.id,
  email: user.email,
  timestamp: Date.now(),
  correlationId: context.correlationId
});

// Metrics collection
metrics.increment('user.created');
metrics.histogram('api.response_time', responseTime);

// Distributed tracing
const span = tracer.startSpan('CreateUser');
span.setTag('user.id', user.id);
// ... operation
span.finish();
```

## 🚀 Deployment Strategy

### Environment Configuration
```yaml
# .env.example
NODE_ENV=development
API_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

### CI/CD Pipeline
```yaml
stages:
  - lint
  - test
  - build
  - security-scan
  - deploy

deploy:
  script:
    - docker build -t app:$CI_COMMIT_SHA .
    - docker push app:$CI_COMMIT_SHA
    - kubectl set image deployment/app app=app:$CI_COMMIT_SHA
```

## 🎨 Frontend Best Practices

### Component Structure
```tsx
// ✅ Composition over inheritance
export const TripCard: FC<TripCardProps> = ({ trip, onEdit, onShare }) => {
  return (
    <Card>
      <CardHeader>
        <TripTitle trip={trip} />
        <TripActions onEdit={onEdit} onShare={onShare} />
      </CardHeader>
      <CardContent>
        <TripDetails trip={trip} />
      </CardContent>
    </Card>
  );
};

// ✅ Custom hooks for logic
export const useTrip = (tripId: string) => {
  const { data, error, isLoading } = useSWR(
    `/api/trips/${tripId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  );

  return {
    trip: data,
    isLoading,
    error,
    mutate: () => mutate(`/api/trips/${tripId}`)
  };
};
```

## 🔐 Security Checklist

- [ ] OWASP Top 10 compliance
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use ORMs/prepared statements)
- [ ] XSS protection (sanitize user input)
- [ ] CSRF tokens implemented
- [ ] Rate limiting on all APIs
- [ ] Secrets management (HashiCorp Vault, AWS Secrets Manager)
- [ ] Regular dependency updates
- [ ] Security headers configured
- [ ] Data encryption at rest and in transit