import { registerSchema, loginSchema } from './user.js'
import { productSchema, productUpdateSchema } from './product.js'
import { cartItemSchema } from './cart.js'
import { paymentSchema, paymentConfirmSchema } from './payment.js'

/**
 * Fábrica de middlewares de validación con Zod.
 * Parsea req.body con el schema recibido y reemplaza su valor
 * por `result.data` (datos ya validados y transformados).
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      })
    }

    req.body = result.data
    next()
  }
}

export const validateUser = validate(registerSchema)
export const validateLogin = validate(loginSchema)
export const validateProduct = validate(productSchema)
export const validateProductUpdate = validate(productUpdateSchema)
export const validateCartItem = validate(cartItemSchema)
export const validatePayment = validate(paymentSchema)
export const validatePaymentConfirm = validate(paymentConfirmSchema)

export {
  registerSchema,
  loginSchema,
  productSchema,
  productUpdateSchema,
  cartItemSchema,
  paymentSchema,
  paymentConfirmSchema
}
