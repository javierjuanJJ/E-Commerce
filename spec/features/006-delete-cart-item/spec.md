# Feature 006: DELETE /cart/:itemId

## Descripción
Elimina un ítem del carrito del usuario autenticado. Un usuario solo puede
eliminar sus propios ítems ( ownership check).

## Criterios de aceptación
- **200** con mensaje de confirmación si el ítem pertenece al usuario.
- **401** sin token.
- **404** si el ítem no existe O pertenece a otro usuario
  (mismo código para no filtrar existencia de recursos ajenos).
