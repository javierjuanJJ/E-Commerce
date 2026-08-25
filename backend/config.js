import 'dotenv/config'

export const config = {
  PORT: process.env.PORT ?? 3000,
  JWT_SECRET: process.env.JWT_SECRET ?? 'ecommerce-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1d',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*'
}
