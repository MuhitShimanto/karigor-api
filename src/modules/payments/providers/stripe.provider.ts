import Stripe from 'stripe';
import { env } from '../../../config/env';
import { PaymentProvider } from './provider.interface';
import { ApiError } from '../../../utils/ApiError';

export const stripeProvider: PaymentProvider = {
  async createPayment({
    bookingId,
    transactionId,
    amount,
    currency,
    customerEmail,
  }) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new ApiError(
        500,
        'STRIPE_SECRET_KEY is not configured in environment',
      );
    }
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: Math.round(amount * 100),
            product_data: { name: `Karigor booking ${bookingId}` },
          },
        },
      ],
      metadata: { transactionId, bookingId },
      success_url: `${env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.CLIENT_URL}/payment/cancel`,
    });
    return { redirectUrl: session.url!, providerRef: session.id };
  },

  async verifyEvent() {
    throw new ApiError(501, 'verifyEvent is implemented in commit 16');
  },
};
