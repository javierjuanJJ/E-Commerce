# Feature 003: GET /products (list)

## Descripción
Lista el catálogo completo de productos, ordenado por fecha de creación
descendente. Endpoint público.

## Criterios de aceptación
- **200** con `{ products: [...] }`.
- No requiere autenticación.
- Cada producto expone: id, title, description, price, stock, imageUrl, createdAt.
- Devuelve array vacío si no hay productos.
