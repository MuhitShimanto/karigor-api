import { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export const notFound: RequestHandler = (req, _res, next) =>
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let message = 'Internal server error';
  let errorDetails: unknown = null;

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    errorDetails = err.errorDetails;
  } else if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    errorDetails = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
  } else if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002'
  ) {
    status = 409;
    message = 'Duplicate value';
    errorDetails = err.meta;
  } else if (
    err?.name === 'JsonWebTokenError' ||
    err?.name === 'TokenExpiredError'
  ) {
    status = 401;
    message = 'Invalid or expired token';
  }

  if (status === 500 && env.NODE_ENV === 'development') {
    errorDetails = err.stack;
  }

  res.status(status).json({ success: false, message, errorDetails });
};
