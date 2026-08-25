# Plan: 003-get-products-list

1. `ProductModel.list()` con `findMany` y `orderBy createdAt desc`.
2. Controlador `list` sin middlewares de auth (público).
3. Montar `GET /products` en `routes/products.js`.

## Notas
- Paginación marcada como backlog (roadmap fase 5).
