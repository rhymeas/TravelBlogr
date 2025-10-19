/**
 * Batch Job Entity - Domain Model
 * 
 * Represents a batch content generation job following DDD principles.
 * Handles business logic for batch processing of blog posts, image captions, etc.
 */

export type BatchJobType = 
  | 'blog_posts_from_trips'
  | 'image_captions'
  | 'seo_metadata'
  | 'trip_plans_for_locations'

export type BatchJobStatus = 
  | 'pending'
  | 'validating'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface BatchJobConfig {
  type: BatchJobType
  sourceIds: string[] // Trip IDs, Image IDs, etc.
  options: {
    autoPublish?: boolean
    generateImages?: boolean
    includeAffiliate?: boolean
    seoOptimize?: boolean
  }
}

export interface BatchJobResult {
  totalItems: number
  successCount: number
  failureCount: number
  skippedCount: number
  generatedIds: string[]
  errors: Array<{
    itemId: string
    error: string
  }>
}

export class BatchJob {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: BatchJobType,
    public readonly config: BatchJobConfig,
    public status: BatchJobStatus,
    public result: BatchJobResult | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public completedAt: Date | null,
    public groqBatchId: string | null
  ) {}

  /**
   * Create a new batch job
   */
  static create(
    userId: string,
    type: BatchJobType,
    config: BatchJobConfig
  ): BatchJob {
    return new BatchJob(
      crypto.randomUUID(),
      userId,
      type,
      config,
      'pending',
      null,
      new Date(),
      new Date(),
      null,
      null
    )
  }

  /**
   * Validate the batch job configuration
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.config.sourceIds || this.config.sourceIds.length === 0) {
      errors.push('No source items provided')
    }

    if (this.config.sourceIds.length > 1000) {
      errors.push('Maximum 1000 items per batch')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Start the batch job
   */
  start(groqBatchId: string): void {
    if (this.status !== 'pending' && this.status !== 'validating') {
      throw new Error(`Cannot start job in ${this.status} status`)
    }

    this.status = 'in_progress'
    this.groqBatchId = groqBatchId
    this.updatedAt = new Date()
  }

  /**
   * Complete the batch job
   */
  complete(result: BatchJobResult): void {
    if (this.status !== 'in_progress') {
      throw new Error(`Cannot complete job in ${this.status} status`)
    }

    this.status = 'completed'
    this.result = result
    this.completedAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Fail the batch job
   */
  fail(error: string): void {
    this.status = 'failed'
    this.result = {
      totalItems: this.config.sourceIds.length,
      successCount: 0,
      failureCount: this.config.sourceIds.length,
      skippedCount: 0,
      generatedIds: [],
      errors: [{
        itemId: 'batch',
        error
      }]
    }
    this.completedAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Cancel the batch job
   */
  cancel(): void {
    if (this.status === 'completed' || this.status === 'failed') {
      throw new Error(`Cannot cancel ${this.status} job`)
    }

    this.status = 'cancelled'
    this.completedAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    if (!this.result) return 0
    if (this.status === 'completed') return 100

    const processed = this.result.successCount + this.result.failureCount + this.result.skippedCount
    return Math.round((processed / this.result.totalItems) * 100)
  }

  /**
   * Convert to JSON for persistence
   */
  toJSON() {
    return {
      id: this.id,
      user_id: this.userId,
      type: this.type,
      config: this.config,
      status: this.status,
      result: this.result,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      completed_at: this.completedAt?.toISOString() || null,
      groq_batch_id: this.groqBatchId
    }
  }

  /**
   * Create from database record
   */
  static fromJSON(data: any): BatchJob {
    return new BatchJob(
      data.id,
      data.user_id,
      data.type,
      data.config,
      data.status,
      data.result,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.completed_at ? new Date(data.completed_at) : null,
      data.groq_batch_id
    )
  }
}

