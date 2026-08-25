# Tasks: 002-post-auth-login

- [x] Crear `loginSchema` con Zod
- [x] Implementar `login` en `controllers/auth.js` (bcrypt.compare)
- [x] Centralizar firma JWT en `UserModel.signToken`
- [x] Montar `POST /auth/login` en `routes/auth.js`
- [x] Test 400 para body inválido sin tocar BD (`app.test.js`)
- [x] Test 401 para rutas protegidas sin token
