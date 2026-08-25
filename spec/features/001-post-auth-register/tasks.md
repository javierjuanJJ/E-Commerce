# Tasks: 001-post-auth-register

- [x] Crear `registerSchema` con Zod (username/email/password)
- [x] Crear middleware genérico `validate(schema)` que parsea y reemplaza req.body
- [x] Implementar hash bcrypt en `UserModel.create`
- [x] Implementar `register` en `controllers/auth.js` con chequeo de email único (409)
- [x] Montar `POST /auth/register` en `routes/auth.js`
- [x] Test de validación 400 sin tocar base de datos (`app.test.js`)
