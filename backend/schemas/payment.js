import { z } from 'zod'

export const paymentSchema = z.object({
  currency: z.enum(['usd', 'eur', 'mxn']).default('usd')
})

export const paymentConfirmSchema = z.object({
  paymentIntentId: z
    .string({ required_error: 'paymentIntentId es requerido' })
    .min(1, 'paymentIntentId no puede estar vacío')
})
