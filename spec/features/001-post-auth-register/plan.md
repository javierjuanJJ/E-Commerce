# Plan: 001-post-auth-register

## Enfoque
Capas: route → validate (Zod) → controller → model (Prisma + bcrypt).

1. Definir `registerSchema` en `backend/schemas/user.js`.
2. Middleware `validate(schema)` en `schemas/index.js` reemplaza `req.body`
   por `result.data` y responde 400 ante fallos.
3. `UserModel.create` hashea la contraseña con bcrypt antes de persistir.
4. El controlador verifica unicidad de email → 409 si existe.
5. Respuesta con `select` de campos públicos (sin password).

## Riesgos
- Email duplicado concurrente: mitigado por constraint `@unique` en Prisma.
- Nunca loguear contraseñas.
