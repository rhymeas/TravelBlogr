import { Entity } from '../base/Entity'
import { UniqueEntityID } from '../base/UniqueEntityID'
import { Result } from '../base/Result'

export interface PostProps {
  tripId: UniqueEntityID
  userId: UniqueEntityID
  title: string
  content: string
  excerpt?: string
  featuredImage?: string
  location?: any // JSON data for post location
  postDate: Date
  orderIndex: number
  createdAt: Date
  updatedAt: Date
}

export class Post extends Entity<PostProps> {
  get id(): UniqueEntityID {
    return this._id
  }

  get tripId(): UniqueEntityID {
    return this.props.tripId
  }

  get userId(): UniqueEntityID {
    return this.props.userId
  }

  get title(): string {
    return this.props.title
  }

  get content(): string {
    return this.props.content
  }

  get excerpt(): string | undefined {
    return this.props.excerpt
  }

  get featuredImage(): string | undefined {
    return this.props.featuredImage
  }

  get location(): any {
    return this.props.location
  }

  get postDate(): Date {
    return this.props.postDate
  }

  get orderIndex(): number {
    return this.props.orderIndex
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  public updateContent(updates: {
    title?: string
    content?: string
    excerpt?: string
    featuredImage?: string
    location?: any
  }): Result<void> {
    this.props.title = updates.title ?? this.props.title
    this.props.content = updates.content ?? this.props.content
    this.props.excerpt = updates.excerpt ?? this.props.excerpt
    this.props.featuredImage = updates.featuredImage ?? this.props.featuredImage
    this.props.location = updates.location ?? this.props.location
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public updateOrder(newOrderIndex: number): Result<void> {
    if (newOrderIndex < 0) {
      return Result.fail<void>(new Error('Order index must be non-negative'))
    }

    this.props.orderIndex = newOrderIndex
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public static create(props: {
    tripId: UniqueEntityID
    userId: UniqueEntityID
    title: string
    content: string
    excerpt?: string
    featuredImage?: string
    location?: any
    postDate: Date
    orderIndex?: number
  }, id?: UniqueEntityID): Result<Post> {
    if (!props.title || props.title.trim().length === 0) {
      return Result.fail<Post>(new Error('Post title is required'))
    }

    if (!props.content || props.content.trim().length === 0) {
      return Result.fail<Post>(new Error('Post content is required'))
    }

    const postProps: PostProps = {
      tripId: props.tripId,
      userId: props.userId,
      title: props.title.trim(),
      content: props.content.trim(),
      excerpt: props.excerpt?.trim(),
      featuredImage: props.featuredImage,
      location: props.location,
      postDate: props.postDate,
      orderIndex: props.orderIndex ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const post = new Post(postProps, id)

    return Result.ok<Post>(post)
  }
}
