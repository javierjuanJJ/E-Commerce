import { prisma } from '../lib/prisma.js'

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
