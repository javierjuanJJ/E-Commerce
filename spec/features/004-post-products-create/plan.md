# Plan: 004-post-products-create

Orden de middlewares (auth primero, validación después):

```
authMiddleware → adminOnly → validateProduct → create
```

1. `requireRole('ADMIN')` exporta `adminOnly` desde `middlewares/role.js`.
2. Controlador delega en `ProductModel.create`.
3. PUT/DELETE reutilizan la misma cadena con `validateProductUpdate` (partial).

## Riesgos
- Un USER con token válido debe recibir 403, nunca 500.
