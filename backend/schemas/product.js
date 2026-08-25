import { z } from 'zod'

export const productSchema = z.object({
  title: z
    .string({ required_error: 'title es requerido' })
    .min(1, 'title no puede estar vacío')
    .max(120, 'title no puede exceder 120 caracteres'),
  description: z
    .string()
    .max(1000, 'description no puede exceder 1000 caracteres')
    .optional()
    .default(''),
  price: z
    .number({ required_error: 'price es requerido', invalid_type_error: 'price debe ser numérico' })
    .positive('price debe ser mayor a 0'),
  stock: z
    .number({ invalid_type_error: 'stock debe ser entero' })
    .int('stock debe ser entero')
    .min(0, 'stock no puede ser negativo')
    .default(0),
  imageUrl: z.string().url('imageUrl debe ser una URL válida').optional()
})

export const productUpdateSchema = productSchema.partial()
