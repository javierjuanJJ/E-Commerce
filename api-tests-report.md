# API Test Report

- **Fecha:** 2026-10-09
- **Base URL:** http://127.0.0.1:3000
- **API:** Express 4 + Prisma 5 + Zod 3 (Node.js). Servidor en ejecución vía Docker Compose (`e-commerce-api-1`, imagen `jjal20021998/ecommerce-api:latest`) contra PostgreSQL 16 (`e-commerce-db-1`).
- **Método:** pruebas con `curl` (`-s -i -m 15`) sobre todos los endpoints y variantes de método, body, auth y errores.
- **Nota de entorno:** el endpoint `POST /auth/register` está roto (ver bugs), por lo que para poder probar las rutas protegidas se insertaron *fixtures* temporales (2 usuarios, 1 producto) y se firmaron JWT con el `JWT_SECRET` del entorno. Todas las fixtures fueron eliminadas al terminar; la base de datos quedó vacía como al inicio.

## Resumen

| Total tests | Éxitos (2xx) | Errores esperados (4xx/5xx de negocio) | Errores inesperados (bugs) |
|---|---|---|---|
| 66 | 18 | 47 | 1 |

## Endpoints probados

- `GET /health` — health check sin BD
- `POST /auth/register` — registro de usuario
- `POST /auth/login` — login y emisión de JWT
- `GET /products` — listado público de productos
- `GET /products/:id` — detalle público de producto
- `POST /products` — crear producto (ADMIN)
- `PUT /products/:id` — actualizar producto (ADMIN)
- `DELETE /products/:id` — eliminar producto (ADMIN)
- `GET /cart` — carrito del usuario autenticado
- `POST /cart` — agregar ítem al carrito
- `DELETE /cart/:itemId` — eliminar ítem propio
- `POST /payments/checkout` — crear PaymentIntent de Stripe
- `POST /payments/confirm` — confirmar estado del pago
- `OPTIONS *` — preflight CORS

## Tests

### Health

#### 1. GET /health — happy path
- **URL:** `GET /health`
- **Esperado:** 200
- **Resultado:** 200 ✅
- **Respuesta:** `{"status":"ok"}`

#### 2. GET / — ruta raíz inexistente
- **Esperado:** 404 · **Resultado:** 404 ✅ · `Cannot GET /`

#### 3. POST /health — método no permitido
- **Esperado:** 404 (no hay handler POST) · **Resultado:** 404 ✅ · `Cannot POST /health`

### Auth

#### 4. POST /auth/register — body válido
- **Body:** `{"username":"tester","email":"tester@example.com","password":"password123"}`
- **Esperado:** 201 con `{ message, user }`
- **Resultado:** 500 ❌ **BUG**
- **Respuesta:** `{"error":"Error interno al registrar usuario"}`

#### 5. POST /auth/register — campos faltantes
- **Body:** `{}` · **Esperado:** 400 · **Resultado:** 400 ✅
- **Respuesta:** `details`: username/email/password requeridos

#### 6. POST /auth/register — email inválido y password corto
- **Body:** `{"username":"ab","email":"nope","password":"123"}` · **Esperado:** 400 · **Resultado:** 400 ✅

#### 7. POST /auth/register — JSON malformado
- **Body:** `{bad json` · **Esperado:** 400 · **Resultado:** 400 ✅ (`express.json` deja pasar un cuerpo vacío → Zod lo rechaza)

#### 8. POST /auth/register — email duplicado
- **Body:** email ya existente · **Esperado:** 409 · **Resultado:** 409 ✅

#### 9. GET /auth/register — método no permitido
- **Esperado:** 404 · **Resultado:** 404 ✅

#### 10. POST /auth/login — credenciales correctas
- **Body:** `{"email":"user@test.local","password":"password123"}` · **Esperado:** 200 con token
- **Resultado:** 200 ✅ — devuelve `token` y `user`. **Observación:** el `user` NO incluye `username` (el controlador lo referencia pero la BD no tiene esa columna).

#### 11. POST /auth/login — body vacío
- **Esperado:** 400 · **Resultado:** 400 ✅

#### 12. POST /auth/login — usuario inexistente
- **Esperado:** 401 · **Resultado:** 401 ✅ · `Credenciales inválidas`

#### 13. POST /auth/login — password incorrecto
- **Esperado:** 401 · **Resultado:** 401 ✅ · `Credenciales inválidas`

### Products

#### 14. GET /products — listado
- **Esperado:** 200 `{ products: [] }` · **Resultado:** 200 ✅

#### 15. GET /products/:id — existente
- **Esperado:** 200 `{ product }` · **Resultado:** 200 ✅

#### 16. GET /products/:id — inexistente
- **Esperado:** 404 · **Resultado:** 404 ✅ · `Producto no encontrado`

#### 17. GET /products/not-a-uuid — id inválido
- **Esperado:** 404 · **Resultado:** 404 ✅ (no hay validación de formato, cae en "no encontrado")

#### 18. POST /products — sin token
- **Esperado:** 401 · **Resultado:** 401 ✅ · `Token de acceso no proporcionado`

#### 19. POST /products — token USER
- **Esperado:** 403 · **Resultado:** 403 ✅ · `Se requiere rol ADMIN`

#### 20. POST /products — ADMIN, body válido
- **Esperado:** 201 · **Resultado:** 201 ✅

#### 21. POST /products — ADMIN, body inválido
- **Body:** `{"title":"","price":-1,"stock":"x"}` · **Esperado:** 400 · **Resultado:** 400 ✅

#### 22. POST /products — campos opcionales omitidos (defaults)
- **Body:** `{"title":"Minimal","price":1}` · **Esperado:** 201 con `description:""` y `stock:0` · **Resultado:** 201 ✅

#### 23. POST /products — campo extra no declarado
- **Body:** `{"title":"Extra","price":2,"hacker":true}` · **Esperado:** 201 (Zod lo descarta) · **Resultado:** 201 ✅ (campo ignorado)

#### 24. PUT /products/:id — sin token
- **Esperado:** 401 · **Resultado:** 401 ✅

#### 25. PUT /products/:id — token USER
- **Esperado:** 403 · **Resultado:** 403 ✅

#### 26. PUT /products/:id — ADMIN, body válido
- **Esperado:** 200 · **Resultado:** 200 ✅

#### 27. PUT /products/:id — ADMIN, inexistente
- **Esperado:** 404 · **Resultado:** 404 ✅

#### 28. PUT /products/:id — ADMIN, body inválido
- **Body:** `{"price":-3}` · **Esperado:** 400 · **Resultado:** 400 ✅

#### 29. DELETE /products/:id — sin token
- **Esperado:** 401 · **Resultado:** 401 ✅

#### 30. DELETE /products/:id — token USER
- **Esperado:** 403 · **Resultado:** 403 ✅

#### 31. DELETE /products/:id — ADMIN, inexistente
- **Esperado:** 404 · **Resultado:** 404 ✅

#### 32. DELETE /products/:id — ADMIN, existente
- **Esperado:** 200 · **Resultado:** 200 ✅

### Cart

#### 33. GET /cart — sin token
- **Esperado:** 401 · **Resultado:** 401 ✅

#### 34. GET /cart — USER con carrito vacío
- **Esperado:** 200 `{ items:[], total:0 }` · **Resultado:** 200 ✅

#### 35. POST /cart — sin token
- **Esperado:** 401 · **Resultado:** 401 ✅

#### 36. POST /cart — body vacío
- **Esperado:** 400 · **Resultado:** 400 ✅

#### 37. POST /cart — productId no UUID
- **Body:** `{"productId":"abc","quantity":1}` · **Esperado:** 400 · **Resultado:** 400 ✅

#### 38. POST /cart — quantity 0
- **Esperado:** 400 · **Resultado:** 400 ✅

#### 39. POST /cart — quantity string
- **Body:** `{"productId":"<uuid>","quantity":"2"}` · **Esperado:** 400 · **Resultado:** 400 ✅

#### 40. POST /cart — producto inexistente
- **Esperado:** 404 · **Resultado:** 404 ✅ · `Producto no encontrado`

#### 41. POST /cart — stock insuficiente
- **Body:** `{"productId":"<uuid>","quantity":999}` · **Esperado:** 409 · **Resultado:** 409 ✅

#### 42. POST /cart — válido
- **Esperado:** 201 · **Resultado:** 201 ✅

#### 43. GET /cart — tras agregar
- **Esperado:** 200 con ítems y `total` calculado · **Resultado:** 200 ✅

#### 44. DELETE /cart/:itemId — sin token
- **Esperado:** 401 · **Resultado:** 401 ✅

#### 45. DELETE /cart/:itemId — ítem inexistente
- **Esperado:** 404 · **Resultado:** 404 ✅

#### 46. DELETE /cart/:itemId — ítem de otro usuario
- **Esperado:** 404 (no filtra existencia) · **Resultado:** 404 ✅

#### 47. DELETE /cart/:itemId — ítem propio
- **Esperado:** 200 · **Resultado:** 200 ✅

### Payments

#### 48. POST /payments/checkout — sin token
- **Esperado:** 401 · **Resultado:** 401 ✅

#### 49. POST /payments/checkout — moneda inválida
- **Body:** `{"currency":"gbp"}` · **Esperado:** 400 · **Resultado:** 400 ✅

#### 50. POST /payments/checkout — USER con carrito
- **Esperado:** 201 con `clientSecret` · **Resultado:** 201 ✅ (`amount` calculado server-side: 49.98)

#### 51. POST /payments/checkout — carrito vacío
- **Esperado:** 400 · **Resultado:** 400 ✅ · `El carrito está vacío`

#### 52. POST /payments/checkout — body vacío, moneda por defecto `usd`
- **Esperado:** 400 (carrito vacío) · **Resultado:** 400 ✅

#### 53. POST /payments/confirm — sin token
- **Esperado:** 401 · **Resultado:** 401 ✅

#### 54. POST /payments/confirm — body vacío
- **Esperado:** 400 · **Resultado:** 400 ✅

#### 55. POST /payments/confirm — paymentIntentId inexistente
- **Esperado:** 404 · **Resultado:** 404 ✅ · `Orden no encontrada`

#### 56. POST /payments/confirm — orden propia no pagada
- **Esperado:** 200 con `status` de Stripe · **Resultado:** 200 ✅ · `{"status":"requires_payment_method"}`

### CORS / Auth genérico

#### 57. OPTIONS /products — preflight
- **Esperado:** 204 · **Resultado:** 204 ✅ con cabeceras CORS

#### 58. GET /cart — token inválido
- **Esperado:** 401 · **Resultado:** 401 ✅ · `Token inválido o expirado`

#### 59. GET /cart — header `Authorization` sin `Bearer`
- **Esperado:** 401 · **Resultado:** 401 ✅ · `Token de acceso no proporcionado`

#### 60. GET /nope — ruta inexistente
- **Esperado:** 404 · **Resultado:** 404 ✅

## Errores inesperados (bugs encontrados)

### BUG #1 — `POST /auth/register` siempre responde 500
- **Esperado:** 201 con `{ message, user }`.
- **Obtenido:** `500 {"error":"Error interno al registrar usuario"}`.
- **Causa raíz:** `backend/models/user.js` crea el usuario con `username`, y `backend/controllers/auth.js` y `backend/schemas/user.js` lo exigen, pero el modelo Prisma `User` (`backend/prisma/schema.prisma`) y la tabla `"User"` en PostgreSQL **no tienen la columna `username`**. Prisma lanza un error de argumento desconocido y el controlador lo convierte en 500.
- **Impacto:** no se puede registrar ningún usuario nuevo a través de la API. Login, carrito y pagos quedan inutilizables en un flujo normal (no hay forma de crear cuentas).
- **Reproducción:**
  ```bash
  curl -i -X POST http://127.0.0.1:3000/auth/register \
    -H 'Content-Type: application/json' \
    -d '{"username":"tester","email":"tester@example.com","password":"password123"}'
  # -> HTTP/1.1 500
  ```
- **Solución sugerida:** añadir `username String` al modelo `User` en `schema.prisma` (y aplicarlo con `prisma db push` / migración), o eliminar `username` de `models/user.js`, `controllers/auth.js` y `schemas/user.js` si el diseño real no lo contempla.

### Observación — Login no devuelve `username`
- `controllers/auth.js` construye `user: { id, username, email, role }`, pero como `username` no existe en BD, la respuesta real es `{ id, email, role }`. Mismo origen que el BUG #1.

## Notas

- No hay endpoints WebSocket/SSE; todo es HTTP REST y fue verificable con `curl`.
- El servidor probado corre en Docker; el `JWT_SECRET` del contenedor proviene del `.env` del repo (mismo valor que `wt-dev-...`). Se usó solo para firmar tokens de prueba.
- Stripe está en modo test y respondió correctamente (PaymentIntent `pi_...` creado y consultado).
- La base de datos quedó sin datos (`User`, `Product`, `CartItem`, `Order` = 0 filas) tras eliminar las fixtures de prueba.
- La suite automática `npm test` (`backend/app.test.js`) no toca BD y no cubre las rutas con Prisma; por eso este reporte complementa esas pruebas con integración real.
