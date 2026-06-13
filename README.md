# AstroMerchant API

The backend service powering business operations for the AstroMerchant Stellar-powered payment gateway.

## Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (Passport)
- **Validation:** class-validator, class-transformer
- **API Docs:** Swagger

## Core Modules

```
src/
├── auth          # Registration, login, JWT strategy
├── merchants     # Merchant CRUD
├── users         # User management
├── payments      # Payment records and status
├── invoices      # Invoice creation and tracking
├── analytics     # Revenue and metrics aggregation
├── webhooks      # Webhook registration and delivery
├── api-keys      # API key generation and validation
├── prisma        # Database service
└── common        # Decorators, filters
```

## Database Models

- Merchant, User, Wallet, Invoice, Payment, Transaction, Webhook, ApiKey

## Getting Started

```bash
npm install
npx prisma migrate dev
npm run start:dev
```

## Environment

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/astromerchant
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
PORT=4000
```

## API Docs

Swagger available at `/api/docs` when running.
