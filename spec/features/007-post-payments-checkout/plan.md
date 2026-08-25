# Plan: 007-post-payments-checkout

1. Router `/payments` protegido con `authMiddleware`.
2. Calcular total del carrito server-side desde `CartModel.getItems`.
3. Crear PaymentIntent con metadata `{ userId }`.
4. Persistir orden `PENDING` con `OrderModel.create`.
5. Devolver solo `clientSecret` al cliente (nunca la secret key).

## Riesgos
- Key de Stripe ausente en dev → error 502 controlado, nunca crash.
- Doble checkout → mitigable idempotency key (backlog).
