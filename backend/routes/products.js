import { Router } from 'express'
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
