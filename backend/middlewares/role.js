export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol ' + requiredRole })
    }
    next()
  }
}

export const adminOnly = requireRole('ADMIN')
