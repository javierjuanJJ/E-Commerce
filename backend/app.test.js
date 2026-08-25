import { before, after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import app from './app.js'

/**
 * Suite de tests de integración SIN base de datos.
 * Solo se prueban capas puras de Express: middlewares, validaciones
 * Zod y control de acceso. Nada de estos tests ejecuta queries contra Prisma,
 * evitando errores de "database locked" en entornos CI.
 */

let server
let BASE_URL

before(() => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address()
      BASE_URL = `http://localhost:${port}`
      resolve()
    })
  })
})

after(() => {
  return new Promise((resolve) => server.close(resolve))
})

describe('GET /health', () => {
  it('responde 200 con status ok', async () => {
    const res = await fetch(`${BASE_URL}/health`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.status, 'ok')
  })
})

describe('Validaciones Zod (sin tocar BD)', () => {
  it('POST /auth/register con body inválido responde 400', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ab', email: 'no-es-email', password: '123' })
    })
    assert.equal(res.status, 400)
    const body = await res.json()
    assert.equal(body.error, 'Validation failed')
    assert.ok(Array.isArray(body.details))
    assert.ok(body.details.length >= 3)
  })

  it('POST /auth/login con email inválido responde 400', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalido', password: '' })
    })
    assert.equal(res.status, 400)
  })

  it('POST /products con price negativo responde 401 (auth primero)', async () => {
    // El middleware auth corre antes que la validación
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'x', price: -5, stock: 1 })
    })
    assert.equal(res.status, 401)
  })

  it('POST /cart con productId no-UUID y sin token responde 401', async () => {
    const res = await fetch(`${BASE_URL}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'abc', quantity: 0 })
    })
    assert.equal(res.status, 401)
  })
})

describe('Control de acceso JWT', () => {
  it('GET /cart sin token responde 401', async () => {
    const res = await fetch(`${BASE_URL}/cart`)
    assert.equal(res.status, 401)
  })

  it('GET /cart con token inválido responde 401', async () => {
    const res = await fetch(`${BASE_URL}/cart`, {
      headers: { Authorization: 'Bearer token-falso' }
    })
    assert.equal(res.status, 401)
  })

  it('POST /payments/checkout sin token responde 401', async () => {
    const res = await fetch(`${BASE_URL}/payments/checkout`, { method: 'POST' })
    assert.equal(res.status, 401)
  })
})

describe('CORS', () => {
  it('expone cabeceras Access-Control-Allow-Origin', async () => {
    const res = await fetch(`${BASE_URL}/health`)
    assert.ok(res.headers.get('access-control-allow-origin'))
  })

  it('OPTIONS responde 204', async () => {
    const res = await fetch(`${BASE_URL}/health`, { method: 'OPTIONS' })
    assert.equal(res.status, 204)
  })
})
