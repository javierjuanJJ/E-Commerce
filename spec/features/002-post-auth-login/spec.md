# Feature 002: POST /auth/login

## Descripción
Autentica al usuario contra credenciales almacenadas y devuelve un JWT válido
por 1 día para usar en headers `Authorization: Bearer <token>`.

## Criterios de aceptación
- **200** con `{ message, token, user }` cuando email y password coinciden.
- **401** con mensaje genérico "Credenciales inválidas" si el email no existe
  o el password no coincide (mismo mensaje para no filtrar información).
- **400** si el body falla la validación Zod.
- El JWT firma `{ id, email, role }` con `JWT_SECRET`.

## Payload del token
```json
{ "id": "uuid", "email": "user@mail.com", "role": "USER" }
```
