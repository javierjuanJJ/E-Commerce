# Tech Stack

| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| Runtime | Node.js | >= 20 | ESM (`"type": "module"`) |
| Framework HTTP | Express | 4.x | Solo en `app.js` / routers |
| ORM | Prisma | 5.x | SQLite (dev) / PostgreSQL (prod) |
| Validación | Zod | 3.x | Middleware `validate(schema)` |
| Autenticación | jsonwebtoken | 9.x | `Authorization: Bearer <token>` |
| Hash de contraseñas | bcrypt | 5.x | 10 salt rounds |
| Pagos | Stripe | 14.x | PaymentIntents |
| Tests | node:test + node:assert | Nativo | Sin dependencias externas |

## Reglas técnicas

- Módulos ES (`import`/`export`), CommonJS prohibido.
- El cliente Prisma se instancia una única vez en `backend/lib/prisma.js`.
- Los secretos viven en `.env` (ver `.env.example`); jamás en el código.
- Los tests NO ejecutan queries contra la base de datos (evita `database locked`).
