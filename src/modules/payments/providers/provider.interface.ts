export interface CreatePaymentInput {
  bookingId: string;
  transactionId: string;
  amount: number;
  currency: string;
  customerEmail: string;
}

export interface VerifyEventInput {
  rawBody: Buffer;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, unknown>;
  body?: unknown;
}

export interface PaymentProvider {
  createPayment(
    input: CreatePaymentInput,
  ): Promise<{ redirectUrl: string; providerRef: string }>;
  verifyEvent(
    input: VerifyEventInput,
  ): Promise<{
    transactionId: string;
    success: boolean;
    method?: string;
    raw: unknown;
  }>;
}
