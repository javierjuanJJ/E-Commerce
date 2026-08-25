import { z } from 'zod'

export const registerSchema = z.object({
  username: z
    .string({ required_error: 'username es requerido' })
    .min(3, 'username debe tener al menos 3 caracteres')
    .max(30, 'username no puede exceder 30 caracteres'),
  email: z
    .string({ required_error: 'email es requerido' })
    .email('email inválido'),
  password: z
    .string({ required_error: 'password es requerido' })
    .min(8, 'password debe tener al menos 8 caracteres')
    .max(64, 'password no puede exceder 64 caracteres')
})

export const loginSchema = z.object({
  email: z.string({ required_error: 'email es requerido' }).email('email inválido'),
  password: z.string({ required_error: 'password es requerido' }).min(1, 'password es requerido')
})
