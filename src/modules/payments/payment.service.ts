import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { stripeProvider } from './providers/stripe.provider';
import {
  PaymentProvider,
  VerifyEventInput,
} from './providers/provider.interface';
import { Prisma } from '@prisma/client';

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
      if (payment.status !== 'PENDING') return; // idempotent: repeated events change nothing

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
};
