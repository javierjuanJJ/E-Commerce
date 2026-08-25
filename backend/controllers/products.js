import { ProductModel } from '../models/product.js'

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
