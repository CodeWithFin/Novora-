export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super('NOT_FOUND', message, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super('CONFLICT', message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super('VALIDATION_ERROR', message, 422);
  }
}
