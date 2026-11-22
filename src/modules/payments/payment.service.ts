import { PaymentProvider } from './providers/provider.interface';
import { ApiError } from '../../utils/ApiError';

export const generateTransactionId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FIX-${timestamp}-${random}`;
};

export const getProvider = (name?: string): PaymentProvider => {
  // Provider implementations will be wired up in subsequent commits
  throw new ApiError(500, `Payment provider ${name || 'default'} is not configured yet`);
};

export const paymentService = {
  getProvider,
  generateTransactionId,
};
