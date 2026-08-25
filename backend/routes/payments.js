import { Router } from 'express'
import { checkout, confirm } from '../controllers/payments.js'
import { validatePayment, validatePaymentConfirm } from '../schemas/index.js'
import { authMiddleware } from '../middlewares/auth.js'

const paymentsRouter = Router()

paymentsRouter.use(authMiddleware)

// POST /payments/checkout - Crea PaymentIntent con el total del carrito
paymentsRouter.post('/checkout', validatePayment, checkout)

// POST /payments/confirm - Confirma el estado del pago
paymentsRouter.post('/confirm', validatePaymentConfirm, confirm)

export { paymentsRouter }
