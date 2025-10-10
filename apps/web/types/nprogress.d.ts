/**
 * Type definitions for nprogress
 * This provides TypeScript support for the nprogress library
 * 
 * Backup type definitions in case @types/nprogress is not available
 */

declare module 'nprogress' {
  export interface NProgressOptions {
    minimum?: number
    template?: string
    easing?: string
    speed?: number
    trickle?: boolean
    trickleSpeed?: number
    showSpinner?: boolean
    parent?: string
  }

  export interface NProgressStatic {
    /**
     * Shows the progress bar
     */
    start(): NProgressStatic

    /**
     * Hides the progress bar
     */
    done(force?: boolean): NProgressStatic

    /**
     * Sets the progress percentage
     * @param n - A number between 0.0 and 1.0
     */
    set(n: number): NProgressStatic

    /**
     * Increments the progress bar
     * @param n - Optional increment amount
     */
    inc(n?: number): NProgressStatic

    /**
     * Configures the progress bar
     * @param options - Configuration options
     */
    configure(options: NProgressOptions): NProgressStatic

    /**
     * Returns the current status
     */
    status: number | null

    /**
     * Checks if the progress bar is being rendered
     */
    isRendered(): boolean

    /**
     * Checks if the progress bar has started
     */
    isStarted(): boolean

    /**
     * Removes the progress bar
     */
    remove(): void
  }

  const NProgress: NProgressStatic
  export default NProgress
}

