export class Result<T> {
  public isSuccess: boolean
  public isFailure: boolean
  public error: Error | string | null
  private _value: T | null

  public constructor(isSuccess: boolean, error?: Error | string | null, value?: T) {
    if (isSuccess && error) {
      throw new Error('InvalidOperation: A result cannot be successful and contain an error')
    }
    if (!isSuccess && !error) {
      throw new Error('InvalidOperation: A failing result needs to contain an error message')
    }

    this.isSuccess = isSuccess
    this.isFailure = !isSuccess
    this.error = error || null
    this._value = value || null

    Object.freeze(this)
  }

  public getValue(): T {
    if (!this.isSuccess) {
      console.log(this.error)
      throw new Error("Can't get the value of an error result. Use 'errorValue' instead.")
    }

    return this._value as T
  }

  public errorValue(): Error {
    return this.error as Error
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, null, value)
  }

  public static fail<U>(error: Error | string): Result<U> {
    return new Result<U>(false, error)
  }

  public static combine(results: Result<any>[]): Result<any> {
    for (let result of results) {
      if (result.isFailure) return result
    }
    return Result.ok()
  }
}
