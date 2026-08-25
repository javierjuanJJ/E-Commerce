# Feature 005: POST /cart (add item)

## Descripción
Agrega un producto al carrito del usuario autenticado. Si el producto ya está
en el carrito, incrementa la cantidad (upsert por par userId+productId).

## Criterios de aceptación
- **201** con `{ message, item }` para usuario autenticado.
- **401** sin token.
- **400** si Zod falla: productId no-UUID, quantity < 1 o no entera.
- **404** si el productId no existe.
- **409** si la quantity excede el stock disponible.

## Reglas de validación (Zod)
| Campo | Regla |
|---|---|
| productId | UUID |
| quantity | entero, min 1, max 999 |

## Integridad
Constraint `@@unique([userId, productId])` en `CartItem`.
