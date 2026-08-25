import { Router } from 'express'
import { register, login } from '../controllers/auth.js'
import { validateUser, validateLogin } from '../schemas/index.js'

const authRouter = Router()

authRouter.post('/register', validateUser, register)
authRouter.post('/login', validateLogin, login)

export { authRouter }
