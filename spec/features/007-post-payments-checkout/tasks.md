# Tasks: 007-post-payments-checkout

- [x] Instanciar cliente Stripe singleton en `controllers/payments.js`
- [x] Implementar `checkout` con cálculo server-side del total
- [x] Crear orden PENDING con `stripePaymentIntentId` único
- [x] Implementar `confirm` para marcar PAID cuando succeeded
- [x] Crear `paymentSchema` / `paymentConfirmSchema` con Zod
- [x] Montar rutas POST /payments/checkout y POST /payments/confirm
- [x] Test 401 sin token (sin BD ni llamadas reales a Stripe)
