import express from 'express'
import { authRouter } from './routes/auth.js'
import { productsRouter } from './routes/products.js'
import { cartRouter } from './routes/cart.js'
import { paymentsRouter } from './routes/payments.js'
import { corsMiddleware } from './middlewares/cors.js'

const app = express()

app.use(corsMiddleware())
app.use(express.json())

// Health check (no toca base de datos)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Declaración de Rutas
app.use('/auth', authRouter)
app.use('/products', productsRouter)
app.use('/cart', cartRouter)
app.use('/payments', paymentsRouter)

export default app
