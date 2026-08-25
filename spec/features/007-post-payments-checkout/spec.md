# Feature 007: POST /payments/checkout

## Descripción
Crea un **PaymentIntent** de Stripe con el monto total del carrito del usuario.
El monto SIEMPRE se calcula en el servidor a partir de los precios en base de
datos; el cliente jamás envía cantidades monetarias.

## Criterios de aceptación
- **201** con `{ clientSecret, amount, currency, paymentIntentId }`.
- **401** sin token.
- **400** si el carrito está vacío.
- **502** si Stripe no está disponible o la key es inválida.
- La orden se crea en estado `PENDING` vinculada al `paymentIntentId` (unique).
- El amount se envía a Stripe en centavos (`Math.round(total * 100)`).

## Reglas de validación (Zod)
| Campo | Regla |
|---|---|
| currency | enum usd/eur/mxn, default usd |

## Flujo posterior
`POST /payments/confirm` consulta el estado del PaymentIntent y marca la
orden como `PAID` cuando `status === 'succeeded'`.
