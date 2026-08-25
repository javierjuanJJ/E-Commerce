# Tasks: 004-post-products-create

- [x] Crear middleware `adminOnly` en `middlewares/role.js`
- [x] Crear `productSchema` con Zod (title/price/stock/imageUrl)
- [x] Implementar `create` en `controllers/products.js`
- [x] Montar `POST /products` con cadena auth → adminOnly → validate
- [x] Test 401 para POST /products sin token (sin BD)
