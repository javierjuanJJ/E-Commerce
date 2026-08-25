import { prisma } from '../lib/prisma.js'

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
