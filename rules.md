# State-of-the-Art Development Structure & Rules

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