import { RequestHandler } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/prisma';

export const authenticate: RequestHandler = catchAsync(
  async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = header.split(' ')[1];
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new ApiError(401, 'Invalid or expired token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }
    if (user.status === 'BANNED') {
      throw new ApiError(403, 'Your account has been banned');
    }

    req.user = user;
    next();
  },
);
