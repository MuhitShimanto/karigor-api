import Stripe from 'stripe';
import { env } from '../../../config/env';
import { PaymentProvider, VerifyEventInput } from './provider.interface';
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

  async verifyEvent({ rawBody, headers }: VerifyEventInput) {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      throw new ApiError(
        500,
        'Stripe keys (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) are not configured',
      );
    }
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const signature = headers['stripe-signature'];
    if (!signature) {
      throw new ApiError(400, 'Missing stripe-signature header');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature as string,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Invalid webhook signature';
      throw new ApiError(400, `Webhook error: ${msg}`);
    }

    if (
      event.type !== 'checkout.session.completed' &&
      event.type !== 'checkout.session.expired'
    ) {
      return { transactionId: '', success: false, raw: event };
    }

    const s = event.data.object as Stripe.Checkout.Session;
    const transactionId = s.metadata?.transactionId || '';
    const success =
      event.type === 'checkout.session.completed' &&
      s.payment_status === 'paid';

    return {
      transactionId,
      success,
      method: 'card',
      raw: event,
    };
  },
};
