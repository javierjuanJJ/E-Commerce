import Stripe from 'stripe'
import { CartModel } from '../models/cart.js'
import { OrderModel } from '../models/order.js'
import { config } from '../config.js'

const stripe = new Stripe(config.STRIPE_SECRET_KEY)

export const checkout = async (req, res) => {
  try {
    const items = await CartModel.getItems(req.user.id)

    if (items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' })
    }

    // El monto SIEMPRE se calcula en el servidor con el total del carrito
    const total = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
    const amountInCents = Math.round(total * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: req.body.currency,
      metadata: { userId: req.user.id }
    })

    await OrderModel.create(req.user.id, total, paymentIntent.id)

    return res.status(201).json({
      message: 'PaymentIntent creado',
      clientSecret: paymentIntent.client_secret,
      amount: total,
      currency: req.body.currency,
      paymentIntentId: paymentIntent.id
    })
  } catch (error) {
    return res.status(502).json({ error: 'Error al comunicarse con Stripe' })
  }
}

export const confirm = async (req, res) => {
  try {
    const { paymentIntentId } = req.body

    const order = await OrderModel.findByPaymentIntentId(paymentIntentId)
    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ error: 'Orden no encontrada' })
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === 'succeeded') {
      await OrderModel.markPaid(order.id)
      return res.json({ message: 'Pago confirmado', orderId: order.id, status: 'PAID' })
    }

    return res.json({ message: 'Pago aún no confirmado', status: paymentIntent.status })
  } catch (error) {
    return res.status(502).json({ error: 'Error al comunicarse con Stripe' })
  }
}
