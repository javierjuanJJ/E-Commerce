import app from './app.js'
import { config } from './config.js'

const PORT = process.env.PORT ?? config.PORT

app.listen(PORT, () => {
  console.log(`Servidor de E-Commerce escuchando en http://localhost:${PORT}`)
})
