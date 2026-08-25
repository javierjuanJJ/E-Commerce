# Arquitectura — E-Commerce API (Loop Engineering / SDD)

## Diagrama de capas

```
Request
   │
   ▼
app.js ──► corsMiddleware ──► express.json ──► Routers
                                                  │
                    ┌─────────────────────────────┤
                    ▼                             ▼
             middlewares/                  routes/
             auth.js (JWT)                 auth | products | cart | payments
             role.js (ADMIN)                      │
                    │                             ▼
                    │                        schemas/  ← Zod valida y reemplaza req.body
                    │                             │
                    └──────────► controllers/ ◄──┘
                                   │
                                   ▼
                               models/  ◄── lib/prisma.js (PrismaClient singleton)
                                   │
                                   ▼
                              SQLite / PostgreSQL
```

## Límites duros

1. **`app.js` es puro**: instancia Express, monta middlewares y routers.
   Sin `async`, sin `.listen()`. El arranque vive SOLO en `server.js`
   o en el hook `before()` de los tests.
2. **Validación en el borde**: ningún controlador recibe datos sin parsear;
   `validate(schema)` reemplaza `req.body` por `result.data`.
3. **Un solo PrismaClient**: exportado desde `backend/lib/prisma.js`.
4. **Seguridad**: bcrypt para passwords, JWT Bearer, roles explícitos,
   montos de pago calculados server-side.

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `backend/app.js` | Instancia Express + middlewares + routers |
| `backend/server.js` | Único punto de `listen()` |
| `backend/config.js` | Config desde variables de entorno |
| `backend/routes/*` | Declaración de endpoints |
| `backend/controllers/*` | Lógica HTTP (status codes, respuestas) |
| `backend/models/*` | Acceso a datos vía Prisma |
| `backend/schemas/*` | Schemas Zod + middleware `validate` |
| `backend/middlewares/*` | CORS, JWT, roles |
| `backend/app.test.js` | Suite `node:test` sin base de datos |

## Estrategia de tests

Los tests solo ejercitan capas puras (validación Zod, JWT, CORS) contra un
servidor en puerto efímero (`app.listen(0)`). **Ningún test ejecuta queries**:
esto elimina los errores de `database locked` en CI y permite correr la suite
sin migrar la base de datos. Las rutas con BD se prueban manualmente con
archivos `.http`/Postman tras `npm run db:push`.

## Endpoints

| Método | Ruta | Auth | Rol |
|---|---|---|---|
| POST | /auth/register | No | — |
| POST | /auth/login | No | — |
| GET | /products | No | — |
| GET | /products/:id | No | — |
| POST | /products | Sí | ADMIN |
| PUT | /products/:id | Sí | ADMIN |
| DELETE | /products/:id | Sí | ADMIN |
| GET | /cart | Sí | USER |
| POST | /cart | Sí | USER |
| DELETE | /cart/:itemId | Sí | USER (owner) |
| POST | /payments/checkout | Sí | USER |
| POST | /payments/confirm | Sí | USER (owner) |
