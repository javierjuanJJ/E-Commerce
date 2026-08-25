import { Router } from 'express'
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
