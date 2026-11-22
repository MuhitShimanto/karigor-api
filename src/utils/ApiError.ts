export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errorDetails: unknown = null,
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}
