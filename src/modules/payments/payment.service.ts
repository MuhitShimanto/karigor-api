import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { stripeProvider } from './providers/stripe.provider';
import {
  PaymentProvider,
  VerifyEventInput,
} from './providers/provider.interface';
import { getPagination } from '../../utils/pagination';
import {
  Prisma,
  User,
  PaymentStatus,
  PaymentProvider as PaymentProviderType,
} from '@prisma/client';

export const generateTransactionId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FIX-${timestamp}-${random}`;
};

export const getProvider = (name?: string): PaymentProvider => {
  if (!name || name === 'STRIPE') {
    return stripeProvider;
  }
  throw new ApiError(400, `Unsupported payment provider: ${name}`);
};

export interface CreatePaymentInput {
  bookingId: string;
  provider?: 'STRIPE' | 'SSLCOMMERZ';
}

export interface ListPaymentsQuery {
  status?: PaymentStatus;
  provider?: PaymentProviderType;
  page?: number;
  limit?: number;
}

export const paymentService = {
  getProvider,
  generateTransactionId,

  async createPayment(userId: string, input: CreatePaymentInput) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { customer: true },
    });

    if (!booking || booking.customerId !== userId) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.status !== 'ACCEPTED') {
      throw new ApiError(
        409,
        'Payment is only allowed for accepted bookings',
      );
    }

    const already = await prisma.payment.findFirst({
      where: { bookingId: input.bookingId, status: 'COMPLETED' },
    });
    if (already) {
      throw new ApiError(409, 'Booking is already paid');
    }

    const providerName = input.provider || 'STRIPE';
    const provider = getProvider(providerName);
    const transactionId = generateTransactionId();

    const payment = await prisma.payment.create({
      data: {
        transactionId,
        bookingId: input.bookingId,
        amount: booking.totalAmount,
        currency: 'usd',
        provider: providerName,
        status: 'PENDING',
      },
    });

    const { redirectUrl, providerRef } = await provider.createPayment({
      bookingId: input.bookingId,
      transactionId,
      amount: Number(booking.totalAmount),
      currency: 'usd',
      customerEmail: booking.customer.email,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayPayload: { providerRef },
      },
    });

    return {
      paymentId: payment.id,
      transactionId,
      redirectUrl,
    };
  },

  async confirmPayment(input: VerifyEventInput, providerName?: string) {
    const provider = getProvider(providerName || env.PAYMENT_PROVIDER);
    const result = await provider.verifyEvent(input);
    if (!result.transactionId) return { ignored: true };

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { transactionId: result.transactionId },
      });
      if (!payment) throw new ApiError(404, 'Payment not found');
      if (payment.status !== 'PENDING') return;

      if (result.success) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paidAt: new Date(),
            method: result.method,
            gatewayPayload: result.raw as Prisma.InputJsonValue,
          },
        });
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'PAID' },
        });
      } else {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            gatewayPayload: result.raw as Prisma.InputJsonValue,
          },
        });
      }
    });

    return { received: true };
  },

  async listPayments(user: User, query: ListPaymentsQuery) {
    const { skip, take, page, limit } = getPagination(query);

    const where: Prisma.PaymentWhereInput = {};
    if (user.role === 'CUSTOMER') {
      where.booking = { customerId: user.id };
    } else if (user.role === 'TECHNICIAN') {
      const profile = await prisma.technicianProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile) {
        return { items: [], meta: { page, limit, total: 0, totalPages: 0 } };
      }
      where.booking = { technicianId: profile.id };
    }

    if (query.status) where.status = query.status;
    if (query.provider) where.provider = query.provider;

    const [items, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              service: { select: { id: true, title: true } },
              customer: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getPaymentById(user: User, paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            service: { select: { id: true, title: true } },
            customer: { select: { id: true, name: true, email: true } },
            technician: { select: { id: true, userId: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    const isOwner = payment.booking.customerId === user.id;
    const isAdmin = user.role === 'ADMIN';
    const isTechnician = payment.booking.technician.userId === user.id;

    if (!isOwner && !isAdmin && !isTechnician) {
      throw new ApiError(
        403,
        'You do not have permission to view this payment',
      );
    }

    return payment;
  },
};
