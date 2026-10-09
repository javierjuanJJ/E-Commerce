# E-Commerce API

API REST modular de comercio electrónico construida con **Node.js + Express + Prisma + Zod**, con autenticación JWT, roles (USER/ADMIN), carrito de compras y pagos con **Stripe PaymentIntents**. Sigue una arquitectura por capas (*Loop Engineering / SDD*): rutas → validación Zod → controladores → modelos Prisma.

> Estado de las pruebas de integración (2026-10-09): 66 casos ejecutados con `curl`, **1 bug detectado** en `POST /auth/register`. Ver [`api-tests-report.md`](./api-tests-report.md).

## Índice

1. [Funcionamiento](#funcionamiento)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Requisitos de instalación](#requisitos-de-instalacion)
4. [Instalación](#instalacion)
5. [Dominio de datos](#dominio-de-datos)
6. [Referencia de endpoints](#referencia-de-endpoints)
7. [Ejemplos de uso](#ejemplos-de-uso)
8. [Tests](#tests)
9. [Licencia](#licencia)

## Funcionamiento

Cada petición atraviesa una cadena de capas estrictas:

1. **CORS** — `middlewares/cors.js` añade cabeceras y responde 204 a los preflight `OPTIONS`.
2. **Body parsing** — `express.json()`.
3. **Router** — `routes/*` declara método y ruta (`/auth`, `/products`, `/cart`, `/payments`).
4. **Auth** — `middlewares/auth.js` valida el JWT `Authorization: Bearer <token>`.
5. **Rol** — `middlewares/role.js` restringe rutas de administración a `ADMIN`.
6. **Validación** — `schemas/*` (Zod) parsea y **reemplaza** `req.body`; si falla responde `400` con `details[]`.
7. **Controlador** — lógica HTTP y códigos de estado.
8. **Modelo** — acceso a datos con un único `PrismaClient` (`lib/prisma.js`).

Reglas clave: el monto del pago **siempre se calcula en el servidor** a partir del carrito, las contraseñas se hashean con **bcrypt (10 rounds)** y nunca se devuelven, y los roles se declaran explícitamente.

## Estructura del proyecto

```text
E-Commerce/
├─ backend/
│  ├─ app.js               # instancia Express + middlewares + routers (puro)
│  ├─ server.js            # único punto de listen()
│  ├─ config.js            # configuración desde variables de entorno
│  ├─ routes/              # auth | products | cart | payments
│  ├─ controllers/         # lógica HTTP (status codes y respuestas)
│  ├─ models/              # acceso a datos vía Prisma
│  ├─ schemas/             # schemas Zod + middleware validate()
│  ├─ middlewares/         # cors, auth (JWT), role (ADMIN)
│  ├─ lib/prisma.js        # PrismaClient singleton
│  ├─ prisma/schema.prisma # modelos User, Product, CartItem, Order
│  └─ app.test.js          # suite node:test (sin BD)
├─ docs/                   # ARCHITECTURE.md, REVERT_AND_MIGRATIONS.md
├─ spec/                   # especificaciones por feature (SDD)
├─ Dockerfile              # imagen de producción
├─ docker-compose.yml      # api + PostgreSQL 16
└─ package.json
```

```mermaid
flowchart TD
    C[Cliente HTTP] -->|Request| A[app.js]
    A --> CORS[cors middleware]
    CORS --> JSON[express.json]
    JSON --> R{Router}
    R -->|/auth| AU[auth]
    R -->|/products| PR[products]
    R -->|/cart| CA[cart]
    R -->|/payments| PA[payments]
    AU & PR & CA & PA --> M[Middlewares auth / ADMIN]
    M --> Z[Validación Zod]
    Z --> CT[Controllers]
    CT --> MO[Models]
    MO --> P[(PrismaClient)]
    P --> DB[(PostgreSQL / SQLite)]
    CT -->|Response JSON| C
```

Flujo de una petición autenticada:

```mermaid
sequenceDiagram
    participant Cliente
    participant API as Express API
    participant MW as Auth + Rol + Zod
    participant DB as PostgreSQL (Prisma)
    Cliente->>API: POST /cart (Bearer token)
    API->>MW: verifica JWT y valida body
    MW-->>API: req.user + req.body validado
    API->>DB: CartModel.addItem(userId, productId, quantity)
    DB-->>API: fila CartItem
    API-->>Cliente: 201 { message, item }
```

## Requisitos de instalación

| Requisito | Versión |
|---|---|
| Node.js | >= 20 (el proyecto usa ESM `"type": "module"`) |
| npm | incluido con Node |
| Base de datos | PostgreSQL 16 **o** SQLite (dev) |
| Docker + Docker Compose | opcional, para el stack completo |
| Cuenta Stripe | clave `sk_test_...` para probar pagos |

## Instalación

### Opción A — Docker Compose (recomendada)

```bash
cp .env.example .env      # rellena JWT_SECRET y claves de Stripe
docker compose up -d --build
curl http://localhost:3000/health
```

El contenedor `api` aplica `prisma db push` al arrancar y expone el puerto `${PORT:-3000}`.

### Opción B — Local

```bash
npm install
npx prisma generate

# SQLite (desarrollo): DATABASE_URL="file:./dev.db"
# PostgreSQL (producción): DATABASE_URL="postgresql://user:pass@host:5432/db"
npx prisma db push

npm start          # http://localhost:3000
```

Variables de entorno (`.env`):

| Variable | Descripción | Por defecto |
|---|---|---|
| `PORT` | Puerto HTTP | `3000` |
| `DATABASE_URL` | Cadena de conexión Prisma | — |
| `JWT_SECRET` | Clave de firma de JWT | `ecommerce-secret-key` |
| `JWT_EXPIRES_IN` | Vida del token | `1d` |
| `STRIPE_SECRET_KEY` | Clave secreta Stripe | `''` |
| `STRIPE_WEBHOOK_SECRET` | Secreto de webhook Stripe | `''` |
| `CORS_ORIGIN` | Origen permitido CORS | `*` |


## Dominio de datos

Modelos definidos en `backend/prisma/schema.prisma`:

```mermaid

erDiagram
    User ||--o{ CartItem : tiene
    User ||--o{ Order : realiza
    Product ||--o{ CartItem : aparece_en

    User {
        string id PK
        string email UK
        string password
        string role
        datetime createdAt
    }

    Product {
        string id PK
        string title
        string description
        float price
        int stock
        string imageUrl
        datetime createdAt
    }

    CartItem {
        string id PK
        string userId FK
        string productId FK
        int quantity
        datetime createdAt
    }

    Order {
        string id PK
        string userId FK
        float total
        string status
        string stripePaymentIntentId UK
        datetime createdAt
    }
```



| Entidad | Campo | Tipo | Notas |
|---|---|---|---|
| User | `id` | uuid | PK |
| User | `email` | string | único |
| User | `password` | string | hash bcrypt, nunca se expone |
| User | `role` | string | `USER` \| `ADMIN` (por defecto `USER`) |
| Product | `price` | float | > 0 |
| Product | `stock` | int | >= 0 (por defecto `0`) |
| CartItem | `quantity` | int | 1..999; único por `(userId, productId)` |
| Order | `status` | string | `PENDING` \| `PAID` \| `FAILED` |
| Order | `stripePaymentIntentId` | string | único |

Entradas: bodies JSON validados con Zod. Salidas: JSON. Persistencia: PostgreSQL (prod) / SQLite (dev) vía Prisma. El total del carrito se agrega en `GET /cart` y `POST /payments/checkout`.

## Referencia de endpoints

Auth: `Bearer <token>` en cabecera `Authorization`. El resultado mostrado proviene de las pruebas reales (ver `api-tests-report.md`).

| Método | Ruta | Auth | Body / params | Éxito | Errores | Probado |
|---|---|---|---|---|---|---|
| GET | `/health` | No | — | `200 {status:"ok"}` | — | ✅ |
| POST | `/auth/register` | No | `{username, email, password}` | `201 {message, user}` | `400` validación, `409` email duplicado | ❌ 500 (bug) |
| POST | `/auth/login` | No | `{email, password}` | `200 {message, token, user}` | `400`, `401` | ✅ |
| GET | `/products` | No | — | `200 {products:[...]}` | — | ✅ |
| GET | `/products/:id` | No | `id` uuid | `200 {product}` | `404` | ✅ |
| POST | `/products` | **ADMIN** | `{title, price, description?, stock?, imageUrl?}` | `201 {message, product}` | `400`, `401`, `403` | ✅ |
| PUT | `/products/:id` | **ADMIN** | campos de producto (parciales) | `200 {message, product}` | `400`, `401`, `403`, `404` | ✅ |
| DELETE | `/products/:id` | **ADMIN** | `id` uuid | `200 {message}` | `401`, `403`, `404` | ✅ |
| GET | `/cart` | **USER** | — | `200 {items, total}` | `401` | ✅ |
| POST | `/cart` | **USER** | `{productId(uuid), quantity(1..999)}` | `201 {message, item}` | `400`, `401`, `404`, `409` | ✅ |
| DELETE | `/cart/:itemId` | **USER (dueño)** | `itemId` uuid | `200 {message}` | `401`, `404` | ✅ |
| POST | `/payments/checkout` | **USER** | `{currency?}` (`usd`\|`eur`\|`mxn`, def. `usd`) | `201 {clientSecret, amount, currency, paymentIntentId}` | `400`, `401`, `502` | ✅ |
| POST | `/payments/confirm` | **USER (dueño)** | `{paymentIntentId}` | `200 {message, orderId, status}` | `400`, `401`, `404`, `502` | ✅ |

Detalle de validaciones Zod:

| Campo | Regla |
|---|---|
| `username` | string, 3–30 |
| `email` | formato email |
| `password` | string, 8–64 |
| `title` | string, 1–120 |
| `price` | número > 0 |
| `stock` | entero >= 0 |
| `imageUrl` | URL válida (opcional) |
| `productId` | UUID |
| `quantity` | entero 1–999 |
| `currency` | `usd` \| `eur` \| `mxn` |

## Ejemplos de uso

```bash
BASE=http://localhost:3000

# Health
curl $BASE/health

# Registro (BUG conocido: devuelve 500; ver api-tests-report.md)
curl -i -X POST $BASE/auth/register -H 'Content-Type: application/json' \
  -d '{"username":"juan","email":"juan@mail.com","password":"secret123"}'

# Login -> guarda el token
TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"juan@mail.com","password":"secret123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# Catálogo público
curl $BASE/products

# Crear producto (ADMIN)
curl -X POST $BASE/products -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Teclado","price":49.9,"stock":10}'

# Agregar al carrito
curl -X POST $BASE/cart -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"productId":"<uuid>","quantity":2}'

# Ver carrito
curl $BASE/cart -H "Authorization: Bearer $TOKEN"

# Checkout (Stripe)
curl -X POST $BASE/payments/checkout -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"currency":"usd"}'
```

## Tests

```bash
npm test    # node --test backend/
```

`backend/app.test.js` ejercita capas puras (Zod, JWT, CORS) contra un servidor en puerto efímero (`app.listen(0)`) **sin tocar la base de datos**, evitando errores de `database locked` en CI. Las rutas con Prisma se validaron manualmente con `curl`; los resultados están en [`api-tests-report.md`](./api-tests-report.md).

## Licencia

Sin archivo de licencia en el repositorio. Contacta al mantenedor antes de reutilizar el código.
