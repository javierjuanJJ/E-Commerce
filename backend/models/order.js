import { prisma } from '../lib/prisma.js'

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
