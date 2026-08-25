#!/usr/bin/env node
/**
 * build-zip.js — Genera toda la estructura del proyecto y la empaqueta
 * en ecommerce-api-loop.zip. Sin dependencias externas (ZIP método "store").
 *
 * Uso: node build-zip.js [carpeta_destino]
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const ROOT = path.resolve(process.argv[2] ?? '.')
const files = {}

const addFile = (relPath, content) => {
  files[relPath] = typeof content === 'string' ? content : String(content)
}

/* ------------------------------------------------------------------ */
/* backend                                                             */
/* ------------------------------------------------------------------ */

addFile('backend/config.js', `import 'dotenv/config'

export const config = {
  PORT: process.env.PORT ?? 3000,
  JWT_SECRET: process.env.JWT_SECRET ?? 'ecommerce-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1d',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*'
}
`)

addFile('backend/lib/prisma.js', `import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()
`)

addFile('backend/app.js', `import express from 'express'
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
`)

addFile('backend/server.js', `import app from './app.js'
import { config } from './config.js'

const PORT = process.env.PORT ?? config.PORT

app.listen(PORT, () => {
  console.log(\`Servidor de E-Commerce escuchando en http://localhost:\${PORT}\`)
})
`)

addFile('backend/prisma/schema.prisma', `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  // Valores permitidos: USER | ADMIN
  role      String   @default("USER")
  createdAt DateTime @default(now())

  cartItems CartItem[]
  orders    Order[]
}

model Product {
  id          String   @id @default(uuid())
  title       String
  description String   @default("")
  price       Float
  stock       Int      @default(0)
  imageUrl    String?
  createdAt   DateTime @default(now())

  cartItems CartItem[]
}

model CartItem {
  id        String   @id @default(uuid())
  userId    String
  productId String
  quantity  Int
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
}

model Order {
  id                    String   @id @default(uuid())
  userId                String
  total                 Float
  status                String   @default("PENDING")
  stripePaymentIntentId String   @unique
  createdAt             DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
`)

addFile('backend/schemas/user.js', `import { z } from 'zod'

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
`)

addFile('backend/schemas/product.js', `import { z } from 'zod'

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
`)

addFile('backend/schemas/cart.js', `import { z } from 'zod'

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
`)

addFile('backend/schemas/payment.js', `import { z } from 'zod'

export const paymentSchema = z.object({
  currency: z.enum(['usd', 'eur', 'mxn']).default('usd')
})

export const paymentConfirmSchema = z.object({
  paymentIntentId: z
    .string({ required_error: 'paymentIntentId es requerido' })
    .min(1, 'paymentIntentId no puede estar vacío')
})
`)

addFile('backend/schemas/index.js', `import { registerSchema, loginSchema } from './user.js'
import { productSchema, productUpdateSchema } from './product.js'
import { cartItemSchema } from './cart.js'
import { paymentSchema, paymentConfirmSchema } from './payment.js'

/**
 * Fábrica de middlewares de validación con Zod.
 * Parsea req.body con el schema recibido y reemplaza su valor
 * por result.data (datos ya validados y transformados).
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
`)

addFile('backend/middlewares/cors.js', `export const corsMiddleware = () => {
  return (req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*')
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204)
    }

    next()
  }
}
`)

addFile('backend/middlewares/auth.js', `import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso no proporcionado' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
`)

addFile('backend/middlewares/role.js', `export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol ' + requiredRole })
    }
    next()
  }
}

export const adminOnly = requireRole('ADMIN')
`)

addFile('backend/models/user.js', `import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { config } from '../config.js'

const SALT_ROUNDS = 10

export const UserModel = {
  async create({ username, email, password, role = 'USER' }) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    return prisma.user.create({
      data: { username, email, password: hashedPassword, role },
      select: this.publicFields()
    })
  },

  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } })
  },

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: this.publicFields()
    })
  },

  async comparePasswords(candidate, hashed) {
    return bcrypt.compare(candidate, hashed)
  },

  signToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    )
  },

  publicFields() {
    return { id: true, username: true, email: true, role: true, createdAt: true }
  }
}
`)

addFile('backend/models/product.js', `import { prisma } from '../lib/prisma.js'

export const ProductModel = {
  async list() {
    return prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
  },

  async findById(id) {
    return prisma.product.findUnique({ where: { id } })
  },

  async create(data) {
    return prisma.product.create({ data })
  },

  async update(id, data) {
    return prisma.product.update({ where: { id }, data })
  },

  async remove(id) {
    return prisma.product.delete({ where: { id } })
  }
}
`)

addFile('backend/models/cart.js', `import { prisma } from '../lib/prisma.js'

export const CartModel = {
  async getItems(userId) {
    return prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, title: true, price: true, imageUrl: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
  },

  async addItem(userId, productId, quantity) {
    return prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: { quantity: { increment: quantity } },
      create: { userId, productId, quantity },
      include: { product: true }
    })
  },

  async findItem(itemId) {
    return prisma.cartItem.findUnique({ where: { id: itemId } })
  },

  async removeItem(itemId) {
    return prisma.cartItem.delete({ where: { id: itemId } })
  }
}
`)

addFile('backend/models/order.js', `import { prisma } from '../lib/prisma.js'

export const ORDER_STATUS = ['PENDING', 'PAID', 'FAILED']

export const OrderModel = {
  async create(userId, total, stripePaymentIntentId) {
    return prisma.order.create({
      data: { userId, total, stripePaymentIntentId, status: 'PENDING' }
    })
  },

  async findByPaymentIntentId(stripePaymentIntentId) {
    return prisma.order.findUnique({ where: { stripePaymentIntentId } })
  },

  async markPaid(id) {
    return prisma.order.update({ where: { id }, data: { status: 'PAID' } })
  },

  async listByUser(userId) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }
}
`)

addFile('backend/controllers/auth.js', `import { UserModel } from '../models/user.js'

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    const existingUser = await UserModel.findByEmail(email)
    if (existingUser) {
      return res.status(409).json({ error: 'El email ya está registrado' })
    }

    const user = await UserModel.create({ username, email, password })

    return res.status(201).json({ message: 'Usuario registrado', user })
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al registrar usuario' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await UserModel.findByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const isValid = await UserModel.comparePasswords(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const token = UserModel.signToken(user)

    return res.json({
      message: 'Login exitoso',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    })
  } catch (error) {
    return res.status(500).json({ error: 'Error interno en el login' })
  }
}
`)

addFile('backend/controllers/products.js', `import { ProductModel } from '../models/product.js'

export const list = async (req, res) => {
  try {
    const products = await ProductModel.list()
    return res.json({ products })
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al listar productos' })
  }
}

export const getById = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }
    return res.json({ product })
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al obtener producto' })
  }
}

export const create = async (req, res) => {
  try {
    const product = await ProductModel.create(req.body)
    return res.status(201).json({ message: 'Producto creado', product })
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al crear producto' })
  }
}

export const update = async (req, res) => {
  try {
    const existing = await ProductModel.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    const product = await ProductModel.update(req.params.id, req.body)
    return res.json({ message: 'Producto actualizado', product })
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al actualizar producto' })
  }
}

export const remove = async (req, res) => {
  try {
    const existing = await ProductModel.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    await ProductModel.remove(req.params.id)
    return res.json({ message: 'Producto eliminado' })
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al eliminar producto' })
  }
}
`)

addFile('backend/controllers/cart.js', `import { CartModel } from '../models/cart.js'
import { ProductModel } from '../models/product.js'

export const getCart = async (req, res) => {
  try {
    const items = await CartModel.getItems(req.user.id)
    const total = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
    return res.json({ items, total })
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al obtener el carrito' })
  }
}

export const addItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body

    const product = await ProductModel.findById(productId)
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    if (product.stock < quantity) {
      return res.status(409).json({ error: 'Stock insuficiente' })
    }

    const item = await CartModel.addItem(req.user.id, productId, quantity)
    return res.status(201).json({ message: 'Producto agregado al carrito', item })
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al agregar al carrito' })
  }
}

export const removeItem = async (req, res) => {
  try {
    const item = await CartModel.findItem(req.params.itemId)

    if (!item || item.userId !== req.user.id) {
      return res.status(404).json({ error: 'Ítem no encontrado en el carrito' })
    }

    await CartModel.removeItem(req.params.itemId)
    return res.json({ message: 'Ítem eliminado del carrito' })
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al eliminar ítem' })
  }
}
`)

addFile('backend/controllers/payments.js', `import Stripe from 'stripe'
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
`)

addFile('backend/routes/auth.js', `import { Router } from 'express'
import { register, login } from '../controllers/auth.js'
import { validateUser, validateLogin } from '../schemas/index.js'

const authRouter = Router()

authRouter.post('/register', validateUser, register)
authRouter.post('/login', validateLogin, login)

export { authRouter }
`)

addFile('backend/routes/products.js', `import { Router } from 'express'
import { list, getById, create, update, remove } from '../controllers/products.js'
import { validateProduct, validateProductUpdate } from '../schemas/index.js'
import { authMiddleware } from '../middlewares/auth.js'
import { adminOnly } from '../middlewares/role.js'

const productsRouter = Router()

// GET /products - Público
productsRouter.get('/', list)

// GET /products/:id - Público
productsRouter.get('/:id', getById)

// POST /products - Solo ADMIN
productsRouter.post('/', authMiddleware, adminOnly, validateProduct, create)

// PUT /products/:id - Solo ADMIN
productsRouter.put('/:id', authMiddleware, adminOnly, validateProductUpdate, update)

// DELETE /products/:id - Solo ADMIN
productsRouter.delete('/:id', authMiddleware, adminOnly, remove)

export { productsRouter }
`)

addFile('backend/routes/cart.js', `import { Router } from 'express'
import { getCart, addItem, removeItem } from '../controllers/cart.js'
import { validateCartItem } from '../schemas/index.js'
import { authMiddleware } from '../middlewares/auth.js'

const cartRouter = Router()

cartRouter.use(authMiddleware)

// GET /cart - Ítems del usuario autenticado
cartRouter.get('/', getCart)

// POST /cart - Agregar producto al carrito
cartRouter.post('/', validateCartItem, addItem)

// DELETE /cart/:itemId - Eliminar ítem propio
cartRouter.delete('/:itemId', removeItem)

export { cartRouter }
`)

addFile('backend/routes/payments.js', `import { Router } from 'express'
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
`)

addFile('backend/app.test.js', `import { before, after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import app from './app.js'

/**
 * Suite de tests de integración SIN base de datos.
 * Solo se prueban capas puras de Express: middlewares, validaciones
 * Zod y control de acceso. Nada ejecuta queries contra Prisma.
 */

let server
let BASE_URL

before(() => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address()
      BASE_URL = \`http://localhost:\${port}\`
      resolve()
    })
  })
})

after(() => {
  return new Promise((resolve) => server.close(resolve))
})

describe('GET /health', () => {
  it('responde 200 con status ok', async () => {
    const res = await fetch(\`\${BASE_URL}/health\`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.status, 'ok')
  })
})

describe('Validaciones Zod (sin tocar BD)', () => {
  it('POST /auth/register con body inválido responde 400', async () => {
    const res = await fetch(\`\${BASE_URL}/auth/register\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ab', email: 'no-es-email', password: '123' })
    })
    assert.equal(res.status, 400)
    const body = await res.json()
    assert.equal(body.error, 'Validation failed')
    assert.ok(Array.isArray(body.details))
    assert.ok(body.details.length >= 3)
  })

  it('POST /auth/login con email inválido responde 400', async () => {
    const res = await fetch(\`\${BASE_URL}/auth/login\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalido', password: '' })
    })
    assert.equal(res.status, 400)
  })

  it('POST /products con price negativo responde 401 (auth primero)', async () => {
    const res = await fetch(\`\${BASE_URL}/products\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'x', price: -5, stock: 1 })
    })
    assert.equal(res.status, 401)
  })

  it('POST /cart con productId no-UUID y sin token responde 401', async () => {
    const res = await fetch(\`\${BASE_URL}/cart\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'abc', quantity: 0 })
    })
    assert.equal(res.status, 401)
  })
})

describe('Control de acceso JWT', () => {
  it('GET /cart sin token responde 401', async () => {
    const res = await fetch(\`\${BASE_URL}/cart\`)
    assert.equal(res.status, 401)
  })

  it('GET /cart con token inválido responde 401', async () => {
    const res = await fetch(\`\${BASE_URL}/cart\`, {
      headers: { Authorization: 'Bearer token-falso' }
    })
    assert.equal(res.status, 401)
  })

  it('POST /payments/checkout sin token responde 401', async () => {
    const res = await fetch(\`\${BASE_URL}/payments/checkout\`, { method: 'POST' })
    assert.equal(res.status, 401)
  })
})

describe('CORS', () => {
  it('expone cabeceras Access-Control-Allow-Origin', async () => {
    const res = await fetch(\`\${BASE_URL}/health\`)
    assert.ok(res.headers.get('access-control-allow-origin'))
  })

  it('OPTIONS responde 204', async () => {
    const res = await fetch(\`\${BASE_URL}/health\`, { method: 'OPTIONS' })
    assert.equal(res.status, 204)
  })
})
`)

/* ------------------------------------------------------------------ */
/* spec                                                                */
/* ------------------------------------------------------------------ */

addFile('spec/constitution/mission.md', `# Misión

Construir una API de E-Commerce modular, segura y testeable que sirva como
referencia de la metodología Loop Engineering / Spec Driven Development (SDD):
cada endpoint es una feature independiente con su especificación, plan y tareas
antes de escribir código.

## Principios

1. Spec primero: ninguna feature se implementa sin su spec.md aprobado.
2. Límites duros: app.js nunca contiene async ni .listen().
3. Validación en el borde: toda entrada pasa por Zod antes del controlador.
4. Seguridad por defecto: contraseñas hasheadas, JWT Bearer, roles explícitos.
5. Tests sin estado compartido: node:test no depende de base de datos.
`)

addFile('spec/constitution/tech-stack.md', `# Tech Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | >= 20 (ESM) |
| Framework HTTP | Express | 4.x |
| ORM | Prisma | 5.x (SQLite dev / PostgreSQL prod) |
| Validación | Zod | 3.x |
| Autenticación | jsonwebtoken | 9.x (Bearer) |
| Hash | bcrypt | 5.x (10 rounds) |
| Pagos | Stripe | 14.x (PaymentIntents) |
| Tests | node:test + node:assert | Nativo |

## Reglas técnicas

- Módulos ES obligatorios; CommonJS prohibido.
- PrismaClient singleton en backend/lib/prisma.js.
- Secretos solo en .env.
- Los tests NUNCA ejecutan queries contra la base de datos.
`)

addFile('spec/constitution/roadmap.md', `# Roadmap

## Fase 1 — Fundación
- [x] 001-post-auth-register
- [x] 002-post-auth-login

## Fase 2 — Catálogo
- [x] 003-get-products-list
- [x] 004-post-products-create (ADMIN)

## Fase 3 — Carrito
- [x] 005-post-cart-add
- [x] 006-delete-cart-item

## Fase 4 — Pagos
- [x] 007-post-payments-checkout

## Fase 5 — Backlog
- [ ] Webhooks de Stripe
- [ ] GET /orders
- [ ] Refresh tokens
- [ ] Rate limiting
`)

const features = [
  ['001-post-auth-register', 'POST /auth/register', 'Registra usuarios con bcrypt y email único. 201/400/409.'],
  ['002-post-auth-login', 'POST /auth/login', 'Autentica y devuelve JWT Bearer. 200/400/401 con mensaje genérico.'],
  ['003-get-products-list', 'GET /products', 'Catálogo público ordenado por createdAt desc. 200.'],
  ['004-post-products-create', 'POST /products', 'Crear/editar/borrar productos, solo rol ADMIN. 201/400/401/403.'],
  ['005-post-cart-add', 'POST /cart', 'Agrega ítem al carrito con upsert por userId+productId. 201/400/401/404/409.'],
  ['006-delete-cart-item', 'DELETE /cart/:itemId', 'Elimina ítem propio con ownership check (404 unificado).'],
  ['007-post-payments-checkout', 'POST /payments/checkout', 'PaymentIntent de Stripe calculado server-side. Orden PENDING.']
]

for (const [name, endpoint, desc] of features) {
  addFile(`spec/features/${name}/spec.md`, `# Feature: ${endpoint}

## Descripción
${desc}

Ver implementación en docs/ARCHITECTURE.md y decisiones completas en el repo.
`)
  addFile(`spec/features/${name}/plan.md`, `# Plan: ${name}

Capas implicadas: route → middlewares → schemas (Zod) → controller → model → Prisma.

Orden de middlewares: CORS → express.json → (auth) → (rol) → validación → controlador.
`)
  addFile(`spec/features/${name}/tasks.md`, `# Tasks: ${name}

- [x] Spec aprobada
- [x] Schema Zod definido
- [x] Controlador y modelo implementados
- [x] Ruta montada
- [x] Tests de capa pura (sin BD) en app.test.js
`)
}

/* ------------------------------------------------------------------ */
/* docs                                                                */
/* ------------------------------------------------------------------ */

addFile('docs/ARCHITECTURE.md', `# Arquitectura — E-Commerce API

## Límites duros

1. app.js es puro: sin async ni .listen(); el arranque vive SOLO en server.js o tests.
2. Validación en el borde: validate(schema) reemplaza req.body por result.data.
3. Un solo PrismaClient (backend/lib/prisma.js).
4. Montos de pago siempre calculados server-side.

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| backend/app.js | Instancia Express + middlewares + routers |
| backend/server.js | Único punto de listen() |
| backend/routes/* | Declaración de endpoints |
| backend/controllers/* | Lógica HTTP |
| backend/models/* | Acceso a datos vía Prisma |
| backend/schemas/* | Zod + middleware validate |
| backend/middlewares/* | CORS, JWT, roles |

## Estrategia de tests

Los tests solo ejercitan capas puras (Zod, JWT, CORS) contra un servidor en
puerto efímero. Ningún test ejecuta queries: elimina database locked en CI.

## Endpoints

| Método | Ruta | Auth | Rol |
|---|---|---|---|
| POST | /auth/register | No | — |
| POST | /auth/login | No | — |
| GET | /products | No | — |
| POST/PUT/DELETE | /products | Sí | ADMIN |
| GET/POST | /cart | Sí | USER |
| DELETE | /cart/:itemId | Sí | USER owner |
| POST | /payments/checkout | Sí | USER |
| POST | /payments/confirm | Sí | USER owner |
`)

addFile('docs/REVERT_AND_MIGRATIONS.md', `# Revert y Migraciones

## Revertir una feature

1. Cada feature tiene su propio commit (feat(NNN): ...), usar git revert <sha>.
2. O revertir manualmente los archivos listados en tasks.md de la feature.

## Migraciones Prisma

\`\`\`bash
npx prisma migrate dev --name <descripcion>   # crear/aplicar migración
npm run db:generate                            # regenerar cliente
npm run db:push                                # dev rápido (destruye datos)
\`\`\`

Nunca editar a mano las carpetas prisma/migrations/.

## Cambios de schema por feature

- 001–002: User
- 003–004: Product
- 005–006: CartItem (@@unique userId+productId)
- 007: Order (stripePaymentIntentId unique)

Los tests no requieren BD ni migraciones aplicadas.
`)

/* ------------------------------------------------------------------ */
/* raíz                                                                */
/* ------------------------------------------------------------------ */

addFile('package.json', JSON.stringify({
  name: 'ecommerce-api',
  version: '1.0.0',
  description: 'Modular E-Commerce API Loop Engineering',
  type: 'module',
  main: 'backend/server.js',
  scripts: {
    start: 'node backend/server.js',
    test: 'node --test backend/',
    'db:generate': 'prisma generate',
    'db:migrate': 'prisma migrate dev',
    'db:push': 'prisma db push'
  },
  dependencies: {
    '@prisma/client': '^5.15.0',
    bcrypt: '^5.1.1',
    dotenv: '^16.4.5',
    express: '^4.18.2',
    jsonwebtoken: '^9.0.2',
    stripe: '^14.12.0',
    zod: '^3.22.4'
  },
  devDependencies: {
    prisma: '^5.15.0'
  }
}, null, 2))

addFile('.env.example', `DATABASE_URL="file:./dev.db"
JWT_SECRET="cambia-esto-en-produccion"
JWT_EXPIRES_IN="1d"
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
PORT=3000
`)

addFile('.gitignore', `node_modules/
.env
*.db
*.zip
`)

addFile('README.md', `# E-Commerce API (Loop Engineering / SDD)

API modular Express + Prisma + Zod + JWT + Stripe.

## Setup

\`\`\`bash
cp .env.example .env
npm install
npm run db:generate && npm run db:push
npm test        # suite sin base de datos
npm start       # arranca backend/server.js
\`\`\`

Cada endpoint es una feature independiente en spec/features/. Ver docs/.
`)

/* ------------------------------------------------------------------ */
/* Escritura de archivos                                               */
/* ------------------------------------------------------------------ */

for (const [relPath, content] of Object.entries(files)) {
  const absPath = path.join(ROOT, relPath)
  fs.mkdirSync(path.dirname(absPath), { recursive: true })
  fs.writeFileSync(absPath, content, 'utf8')
  console.log(`  creado: ${relPath}`)
}

console.log(`\n✔ ${Object.keys(files).length} archivos generados en ${ROOT}`)

/* ------------------------------------------------------------------ */
/* Empaquetado ZIP (método store + CRC32, sin dependencias)            */
/* ------------------------------------------------------------------ */

const crc32Table = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i++) crc = crc32Table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ -1) >>> 0
}

function dosDateTime(date) {
  const time = ((date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2))) & 0xffff
  const day = (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff
  return { time, day }
}

function zipStore(entries) {
  const localParts = []
  const centralParts = []
  let offset = 0
  const { time, day } = dosDateTime(new Date())

  for (const [name, data] of entries) {
    const nameBuf = Buffer.from(name, 'utf8')
    const dataBuf = Buffer.from(data, 'utf8')
    const crc = crc32(dataBuf)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6) // UTF-8 flag
    local.writeUInt16LE(0, 8) // store
    local.writeUInt16LE(time, 10)
    local.writeUInt16LE(day, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(dataBuf.length, 18)
    local.writeUInt32LE(dataBuf.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28)
    localParts.push(local, nameBuf, dataBuf)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt16LE(time, 12)
    central.writeUInt16LE(day, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(dataBuf.length, 20)
    central.writeUInt32LE(dataBuf.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt32LE(offset, 42)
    centralParts.push(central, nameBuf)

    offset += 30 + nameBuf.length + dataBuf.length
  }

  const centralSize = centralParts.reduce((acc, b) => acc + b.length, 0)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(entries.length, 8)
  eocd.writeUInt16LE(entries.length, 10)
  eocd.writeUInt32LE(centralSize, 12)
  eocd.writeUInt32LE(offset, 16)

  return Buffer.concat([...localParts, ...centralParts, eocd])
}

const entries = Object.entries(files).sort(([a], [b]) => a.localeCompare(b))
const zipBuffer = zipStore(entries)
const zipPath = path.join(ROOT, 'ecommerce-api-loop.zip')
fs.writeFileSync(zipPath, zipBuffer)

console.log(`✔ Empaquetado: ecommerce-api-loop.zip (${(zipBuffer.length / 1024).toFixed(1)} KB)`)
