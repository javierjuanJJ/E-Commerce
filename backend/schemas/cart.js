import { z } from 'zod'

export const cartItemSchema = z.object({
  productId: z
    .string({ required_error: 'productId es requerido' })
    .uuid('productId debe ser un UUID válido'),
  quantity: z
    .number({ required_error: 'quantity es requerido', invalid_type_error: 'quantity debe ser numérico' })
    .int('quantity debe ser entero')
    .min(1, 'quantity mínima es 1')
    .max(999, 'quantity máxima es 999')
})
