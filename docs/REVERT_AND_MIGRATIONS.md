# Revert y Migraciones

## Cómo revertir una feature

Cada feature en `spec/features/NNN-*` está aislada por capas. Para revertir:

1. **Identificar los archivos tocados** en `tasks.md` de la feature.
2. **Rutas**: eliminar el bloque `app.use('/ruta', router)` en `backend/app.js`
   o las líneas correspondientes dentro del archivo del router.
3. **Controladores/Modelos**: eliminar el archivo si la feature lo introdujo;
   si era compartido, revertir solo sus funciones.
4. **Schema Prisma**: ver sección de migraciones.
5. **Commits**: cada feature se integra con un commit propio
   (`feat(001): post auth register`), por lo que `git revert <sha>` revierte
   código + spec atómicamente.

### Tabla de reversión rápida

| Feature | Archivos implicados | Revert seguro |
|---|---|---|
| 001 register | schemas/user.js, controllers/auth.js, models/user.js, routes/auth.js | Sí |
| 002 login | ídem 001 (función `login`, `loginSchema`) | Sí |
| 003 list products | controllers/products.js, models/product.js, routes/products.js | Sí |
| 004 create product | middlewares/role.js, productSchema, rutas POST/PUT/DELETE | Sí |
| 005 add cart item | models/cart.js, controllers/cart.js, routes/cart.js, cartItemSchema | Sí |
| 006 delete cart item | función `removeItem` | Sí |
| 007 payments checkout | controllers/payments.js, routes/payments.js, paymentSchema, Order model | Sí |

## Migraciones (Prisma)

```bash
# Crear/aplicar migración tras cambiar schema.prisma
npx prisma migrate dev --name <descripcion_corta>

# Regenerar cliente tras cambios
npm run db:generate

# Desarrollo rápido sin historial de migraciones (destruye datos)
npm run db:push

# Revertir el último cambio aplicado en desarrollo
npx prisma migrate resolve --rolled-back <nombre_migracion>
# y editar schema.prisma al estado previo + nueva migración
```

### Cambios de schema por feature

- **001–002**: creación de `User`.
- **003–004**: creación de `Product`.
- **005–006**: creación de `CartItem` con `@@unique([userId, productId])`.
- **007**: creación de `Order` con `stripePaymentIntentId @unique`.

Para revertir una feature con cambios de schema, escribir una nueva migración
que elimine la tabla/campos correspondientes. Nunca editar a mano las carpetas
`prisma/migrations/`.

## Nota sobre tests y BD

La suite `node:test` no ejecuta queries: no requiere base de datos activa ni
migraciones aplicadas, y es inmune a errores de `database locked`. Ver
`docs/ARCHITECTURE.md → Estrategia de tests`.
