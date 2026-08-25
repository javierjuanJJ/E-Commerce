import { CartModel } from '../models/cart.js'
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
