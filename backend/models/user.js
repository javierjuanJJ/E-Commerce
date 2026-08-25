import bcrypt from 'bcrypt'
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
