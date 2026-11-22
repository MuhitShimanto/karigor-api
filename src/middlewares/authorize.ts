import { RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) =>
    req.user && roles.includes(req.user.role)
      ? next()
      : next(new ApiError(403, 'You do not have permission'));
