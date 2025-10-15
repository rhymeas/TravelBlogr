import { AggregateRoot } from '../base/AggregateRoot'
import { UniqueEntityID } from '../base/UniqueEntityID'
import { Result } from '../base/Result'
import { TripTitle } from '../value-objects/TripTitle'
import { TripSlug } from '../value-objects/TripSlug'
import { DateRange } from '../value-objects/DateRange'
import { TripStatus } from '../value-objects/TripStatus'
import { Post } from './Post'
import { ShareLink } from './ShareLink'
import { TripCreatedEvent } from '../events/TripCreatedEvent'
import { TripPublishedEvent } from '../events/TripPublishedEvent'

export interface TripProps {
  userId: UniqueEntityID
  title: TripTitle
  description?: string
  slug: TripSlug
  coverImage?: string
  dateRange?: DateRange
  status: TripStatus
  isFeatured: boolean
  locationData?: any // JSON data for trip locations
  posts: Post[]
  shareLinks: ShareLink[]
  createdAt: Date
  updatedAt: Date
}

export class Trip extends AggregateRoot<TripProps> {
  get id(): UniqueEntityID {
    return this._id
  }

  get userId(): UniqueEntityID {
    return this.props.userId
  }

  get title(): TripTitle {
    return this.props.title
  }

  get description(): string | undefined {
    return this.props.description
  }

  get slug(): TripSlug {
    return this.props.slug
  }

  get coverImage(): string | undefined {
    return this.props.coverImage
  }

  get dateRange(): DateRange | undefined {
    return this.props.dateRange
  }

  get status(): TripStatus {
    return this.props.status
  }

  get isFeatured(): boolean {
    return this.props.isFeatured
  }

  get locationData(): any {
    return this.props.locationData
  }

  get posts(): Post[] {
    return this.props.posts
  }

  get shareLinks(): ShareLink[] {
    return this.props.shareLinks
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  public updateDetails(updates: {
    title?: TripTitle
    description?: string
    coverImage?: string
    dateRange?: DateRange
  }): Result<void> {
    if (updates.title) {
      this.props.title = updates.title
      // Update slug when title changes
      const slugResult = TripSlug.create(updates.title.value)
      if (slugResult.isFailure) {
        return Result.fail<void>(slugResult.error || new Error('Invalid slug'))
      }
      this.props.slug = slugResult.getValue()
    }

    this.props.description = updates.description ?? this.props.description
    this.props.coverImage = updates.coverImage ?? this.props.coverImage
    this.props.dateRange = updates.dateRange ?? this.props.dateRange
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public publish(): Result<void> {
    if (this.props.status.value === 'published') {
      return Result.fail<void>(new Error('Trip is already published'))
    }

    const publishedStatus = TripStatus.create('published')
    if (publishedStatus.isFailure) {
      return Result.fail<void>(publishedStatus.error || new Error('Invalid status'))
    }

    this.props.status = publishedStatus.getValue()
    this.props.updatedAt = new Date()

    this.addDomainEvent(new TripPublishedEvent(this))

    return Result.ok<void>()
  }

  public archive(): Result<void> {
    const archivedStatus = TripStatus.create('archived')
    if (archivedStatus.isFailure) {
      return Result.fail<void>(archivedStatus.error || new Error('Invalid status'))
    }

    this.props.status = archivedStatus.getValue()
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public addPost(post: Post): Result<void> {
    if (post.tripId.toString() !== this.id.toString()) {
      return Result.fail<void>(new Error('Post does not belong to this trip'))
    }

    this.props.posts.push(post)
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public removePost(postId: UniqueEntityID): Result<void> {
    const postIndex = this.props.posts.findIndex(p => p.id.equals(postId))
    if (postIndex === -1) {
      return Result.fail<void>(new Error('Post not found in trip'))
    }

    this.props.posts.splice(postIndex, 1)
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public addShareLink(shareLink: ShareLink): Result<void> {
    if (shareLink.tripId.toString() !== this.id.toString()) {
      return Result.fail<void>(new Error('Share link does not belong to this trip'))
    }

    this.props.shareLinks.push(shareLink)
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public static create(props: {
    userId: UniqueEntityID
    title: TripTitle
    description?: string
    dateRange?: DateRange
  }, id?: UniqueEntityID): Result<Trip> {
    const slugResult = TripSlug.create(props.title.value)
    if (slugResult.isFailure) {
      return Result.fail<Trip>(slugResult.error || new Error('Invalid slug'))
    }

    const statusResult = TripStatus.create('draft')
    if (statusResult.isFailure) {
      return Result.fail<Trip>(statusResult.error || new Error('Invalid status'))
    }

    const tripProps: TripProps = {
      userId: props.userId,
      title: props.title,
      description: props.description,
      slug: slugResult.getValue(),
      dateRange: props.dateRange,
      status: statusResult.getValue(),
      isFeatured: false,
      posts: [],
      shareLinks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const trip = new Trip(tripProps, id)
    
    // Add domain event
    trip.addDomainEvent(new TripCreatedEvent(trip))

    return Result.ok<Trip>(trip)
  }
}
