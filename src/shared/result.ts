class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error?: string | Error;
  private readonly _value?: T;

  private constructor(isSuccess: boolean, error?: string | Error, value?: T) {
    if (isSuccess && error) {
      throw new Error("InvalidOperation: A result cannot be successful and contain an error");
    }
    if (!isSuccess && !error) {
      throw new Error("InvalidOperation: A failing result needs to contain an error message");
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  // Lança apenas por uso indevido da API (ler valor de um Result falho),
  // nunca para modelar uma falha de regra de negócio — essa é sempre um Result.fail().
  public getValue(): T {
    if (this.isFailure) {
      throw new Error(
        `Cannot get the value of a failed result. Use 'error' instead. Error: ${this.formatError()}`,
      );
    }
    return this._value as T;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  public static fail<U>(error: string | Error): Result<U> {
    return new Result<U>(false, error);
  }

  // biome-ignore lint/suspicious/noExplicitAny: combine só olha isFailure/error, o tipo do valor de sucesso é irrelevante aqui.
  public static combine(results: Result<any>[]): Result<any> {
    for (const result of results) {
      if (result.isFailure) return result;
    }
    return Result.ok();
  }

  private formatError(): string {
    return this.error instanceof Error ? this.error.message : String(this.error);
  }
}

export { Result };
