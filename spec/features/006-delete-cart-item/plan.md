# Plan: 006-delete-cart-item

1. Buscar ítem con `CartModel.findItem(itemId)`.
2. Ownership check: `item.userId === req.user.id`; si falla → 404.
3. Eliminar con `CartModel.removeItem`.

## Seguridad
- Nunca devolver 200 para ítems ajenos aunque existan.
- onDelete: Cascade configurado en Prisma para limpiar huérfanos.
