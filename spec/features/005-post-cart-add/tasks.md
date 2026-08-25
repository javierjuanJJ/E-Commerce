# Tasks: 005-post-cart-add

- [x] Crear `cartItemSchema` con Zod
- [x] Implementar upsert en `CartModel.addItem`
- [x] Implementar `addItem` con chequeos de producto inexistente (404) y stock (409)
- [x] Aplicar `authMiddleware` a todo el router de cart
- [x] Test 401 sin token (sin BD)
