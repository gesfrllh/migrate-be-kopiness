# Kopiness API

Backend API untuk aplikasi Kopiness — manajemen kopi, transaksi, dan coffee assistant berbasis NestJS.

## Tech Stack

| Teknologi | Versi |
|---|---|
| NestJS | 9.4.3 |
| Prisma ORM | ^4.14.1 |
| PostgreSQL | - |
| Passport (JWT + Google OAuth) | - |
| Supabase Storage | - |
| Google Gemini AI | - |
| Swagger | 5.2.1 |
| Jest | 29.5.0 |

## Fitur

- **Autentikasi** — Register, login (JWT), Google OAuth, logout (blacklist token), forgot/reset password
- **Manajemen Produk** — CRUD produk kopi dengan pagination & search
- **Transaksi** — Cart → submit → antrian kasir → bayar (multi transaksi) → cancel
- **Tracking Order** — Timeline log-based: CREATED → PAYMENT_STARTED → PAID → CANCELLED
- **Coffee Assistant** — Generator panduan brewing kopi (dosis, ratio, grind, suhu, susu)
- **AI Assistant** — Analisis & rekomendasi brewing via Google Gemini
- **File Upload** — Upload gambar ke Supabase Storage
- **Dashboard** — Overview stats, revenue chart, top products, payment breakdown
- **Role-based Access** — ADMIN / CUSTOMER

## Prerequisites

- Node.js >= 18
- Yarn
- PostgreSQL (atau Prisma Postgres)

## Environment Variables

Buat file `.env` dari contoh:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Secret key untuk JWT |
| `PORT` | Port server (default 7243) |
| `SUPABASE_URL` | URL Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase |
| `SUPABASE_SECRET_KEY` | Secret key Supabase |
| `SUPABASE_ACCESS_KEY` | Access key Supabase |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Callback URL Google OAuth |
| `COOKIE_ENCRYPTION_KEY` | Key enkripsi cookie (32 bytes hex) |
| `SECRET_KEY` | Key AES-256-GCM (32 bytes hex) |
| `GOOGLEAI_KEY` | API key Google Gemini AI |

## Instalasi

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn prisma generate

# Run migrasi database
yarn prisma migrate dev

# Seed data awal
yarn prisma db seed

# Jalankan development server
yarn start:dev
```

Server akan berjalan di `http://localhost:7243/api`

## Scripts

| Script | Description |
|---|---|
| `yarn build` | Generate Prisma + build NestJS |
| `yarn start:dev` | Development mode (watch) |
| `yarn start:prod` | Production mode |
| `yarn test` | Unit tests |
| `yarn test:e2e` | E2E tests |
| `yarn lint` | ESLint fix |
| `yarn studio` | Prisma Studio |
| `yarn format` | Prettier format |

## API Documentation

Swagger UI tersedia di:

```
http://localhost:7243/api
```

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | - | Register user baru |
| POST | `/api/auth/login` | - | Login, return cookie `access_token` |
| POST | `/api/auth/logout` | - | Logout (hapus cookie) |
| GET | `/api/auth/google` | - | Redirect Google OAuth |
| GET | `/api/auth/google/callback` | - | Google OAuth callback |
| GET | `/api/auth/me` | JWT | Get current user |
| POST | `/api/auth/forgot-password` | - | Request reset password |
| POST | `/api/auth/reset-password` | - | Reset password |

### Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | JWT | List produk (pagination + search) |
| POST | `/api/products` | JWT | Buat produk baru |
| GET | `/api/products/:id` | JWT | Detail produk |
| PATCH | `/api/products/:id` | JWT | Update produk |
| DELETE | `/api/products/:id` | JWT | Hapus produk |

### Transactions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/transactions` | JWT | Submit cart ke kasir |
| GET | `/api/transactions` | JWT | List antrian pending |
| POST | `/api/transactions/payment` | JWT | Bayar transaksi |
| POST | `/api/transactions/history` | JWT | Riwayat transaksi |
| POST | `/api/transactions/:id/cancel` | JWT | Batalkan transaksi |
| GET | `/api/transactions/:id` | JWT | Detail transaksi + tracking |
| GET | `/api/transactions/:id/tracking` | JWT | Tracking timeline |
| GET | `/api/transactions/admin/summary` | JWT | Admin summary dashboard |

### Payment Methods

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/payment-methods` | JWT | List metode pembayaran |
| GET | `/api/payment-methods/:id` | JWT | Detail metode pembayaran |

### File Upload

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/file/upload` | JWT | Upload gambar ke Supabase |

### Coffee Assistant

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/coffee-assistant/generate` | JWT | Generate panduan brewing |
| GET | `/api/coffee-assistant/options` | JWT | List opsi dropdown |

### AI Assistant

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/coffe-assistant` | - | Analisis brewing via Google Gemini |

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/overview` | - | Overview stats dashboard |

## Database Schema

### Models

- **User** — `id`, `name`, `email` (unique), `password` (nullable), `role` (ADMIN/CUSTOMER)
- **Product** — `id`, `name`, `description`, `origin`, `roastLevel`, `process`, `flavorNotes`, `price`, `stock`, `imageUrl[]`, `createdById`
- **Transaction** — `id`, `orderNumber` (unique), `total`, `status` (PENDING/PAID/CANCELLED), `createdById`, `paymentId`
- **TransactionItem** — `id`, `quantity`, `price` (nullable), `productId`, `transactionId`
- **Payment** — `id`, `invoiceNumber` (unique), `totalAmount`, `method` (sopay/dana/gopay/qris), `paidAt`
- **TransactionLog** — `id`, `transactionId`, `action` (CREATED/PAID/CANCELLED/etc), `message`, `meta` (JSON), `createdAt`
- **BlacklistedToken** — `id`, `token` (unique), `createdAt`
- **PasswordResetToken** — `id`, `token` (unique), `email`, `expiresAt`, `createdAt`
- **orderSequence** — `date` (PK), `value` (counter untuk nomor order)

## Struktur Project

```
src/
├── auth/             # Auth module (register, login, google OAuth, JWT)
├── common/           # Shared guards, decorators, interceptors, types, utils
├── file/             # File upload ke Supabase
├── lib/              # External client config (Supabase)
├── modules/
│   ├── ai/           # Google Gemini AI assistant
│   ├── coffe/        # Coffee brewing guide generator
│   ├── dashboard/    # Admin dashboard overview
│   ├── payment/      # Payment methods (static)
│   ├── product/      # Product CRUD
│   └── transaction/  # Transaction flow + tracking
├── prisma/           # Prisma service & module
└── utils/            # Crypto, enum utils
```

## Testing

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e
```

## Deployment

Untuk Vercel, konfigurasi sudah ada di `vercel.json`:

```json
{
  "version": 2,
  "builds": [{ "src": "src/main.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/main.ts" }]
}
```

Pastikan semua environment variables diatur di Vercel dashboard.
