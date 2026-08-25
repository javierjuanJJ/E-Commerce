# Feature 004: POST /products (create)

## Descripción
Crea un producto en el catálogo. Restringido al rol **ADMIN** mediante
middlewares encadenados (`authMiddleware` → `adminOnly` → `validateProduct`).

## Criterios de aceptación
- **201** con `{ message, product }` para ADMIN con datos válidos.
- **401** sin token o token inválido.
- **403** si el rol del token no es ADMIN.
- **400** si Zod falla: title vacío, price <= 0, stock negativo, imageUrl no-URL.

## Reglas de validación (Zod)
| Campo | Regla |
|---|---|
| title | string, min 1, max 120 |
| description | string opcional, max 1000 |
| price | number > 0 |
| stock | entero >= 0 |
| imageUrl | URL válida, opcional |
