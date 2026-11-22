import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { hashPassword, comparePassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import { Role } from '@prisma/client';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: 'CUSTOMER' | 'TECHNICIAN';
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

const sanitize = <T extends { passwordHash?: string }>(
  user: T,
): Omit<T, 'passwordHash'> => {
  const { passwordHash: _, ...rest } = user;
  return rest;
};

export const authService = {
  async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ApiError(409, 'Email is already registered');
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: data.role as Role,
          phone: data.phone,
        },
      });

      if (data.role === 'TECHNICIAN') {
        await tx.technicianProfile.create({
          data: {
            userId: newUser.id,
            location: '',
            hourlyRate: 0,
            skills: [],
          },
        });
      }

      return newUser;
    });

    return {
      token: signToken({ id: user.id, role: user.role }),
      user: sanitize(user),
    };
  },

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await comparePassword(data.password, user.passwordHash))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.status === 'BANNED') {
      throw new ApiError(403, 'Your account has been banned');
    }

    return {
      token: signToken({ id: user.id, role: user.role }),
      user: sanitize(user),
    };
  },
};
