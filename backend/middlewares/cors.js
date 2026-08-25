export const corsMiddleware = () => {
  return (req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*')
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204)
    }

    next()
  }
}
