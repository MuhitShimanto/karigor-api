import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
  CLIENT_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(['STRIPE', 'SSLCOMMERZ']).default('STRIPE'),
  SSLC_STORE_ID: z.string().optional(),
  SSLC_STORE_PASSWORD: z.string().optional(),
  SSLC_IS_LIVE: z.coerce.boolean().default(false),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    'Invalid environment variables',
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}
export const env = parsed.data;
