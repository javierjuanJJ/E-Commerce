# Plan: 002-post-auth-login

1. `loginSchema` (email + password requeridos).
2. Controlador busca usuario por email con `UserModel.findByEmail`.
3. Comparación segura con `bcrypt.compare` (timing-safe).
4. Firma del token centralizada en `UserModel.signToken` usando `config.js`.
5. Mensaje de error único (401) para usuario inexistente o contraseña errónea.

## Seguridad
- No revelar si el email existe.
- Secret configurable vía env; nunca commiteado.
