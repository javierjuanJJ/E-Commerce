import { UserModel } from '../models/user.js'

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
