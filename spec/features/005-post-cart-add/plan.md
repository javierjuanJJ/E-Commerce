# Plan: 005-post-cart-add

1. `authMiddleware` a nivel router (`cartRouter.use(authMiddleware)`).
2. Validar body con `validateCartItem`.
3. Verificar existencia del producto (404) y stock suficiente (409).
4. `CartModel.addItem` usa `upsert` con clave compuesta `userId_productId`.

## Notas
- La quantity se acumula con `{ increment: quantity }` en el update.
