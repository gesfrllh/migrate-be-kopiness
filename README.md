# Kopiness API

Backend API untuk aplikasi Kopiness — manajemen kopi, multi-store, transaksi, cart, dan coffee assistant berbasis NestJS.

## Tech Stack

| Teknologi | Versi |
|---|---|
| NestJS | 9.4.3 |
| Prisma ORM | ^4.14.1 |
| PostgreSQL | - |
| Passport (JWT + Google OAuth) | - |
| Supabase Storage | - |
| Google Gemini AI (`@google/genai`) | ^2.8.0 |
| Swagger | 5.2.1 |
| Jest | 29.5.0 |
| Argon2 | ^0.44.0 |
| Helmet | ^8.2.0 |

## Fitur

- **Autentikasi** — Register (auto CUSTOMER), login (JWT via httpOnly cookie terenkripsi AES-256-GCM), Google OAuth, logout, forgot/reset password
- **Role-based Access** — `SUPERADMIN` | `STOREOWNER` | `CUSTOMER`
- **Multi-Store** — Setiap store punya owner (STOREOWNER), location-based search (Haversine distance), slug-based detail
- **Manajemen Produk** — CRUD produk per store, pagination & search
- **Cart** — Keranjang per user (add, update, remove, clear) dengan validasi stock
- **Transaksi** — Cart → submit → antrian kasir → bayar multi-transaksi → cancel
- **Order Tracking** — Timeline log-based: CREATED → PAYMENT_STARTED → PAID → IN_PROGRESS → DELIVERED, dengan progress bar
- **Store Orders** — STOREOWNER bisa lihat & update status order (IN_PROGRESS / DELIVERED)
- **Coffee Assistant** — Generator panduan brewing (dosis, ratio, grind, suhu, susu, foam)
- **AI Assistant (Gemini)** — Diagnosa & rekomendasi adjustment brewing via Google Gemini
- **File Upload** — Upload & validasi gambar (magic bytes) ke Supabase Storage
- **Dashboard** — Overview stats, payment breakdown, revenue chart (7 hari), top products
- **Rate Limiting** — 60 request/menit via `@nestjs/throttler`
- **Security** — Helmet, cookie encryption, JWT blacklist, XSS protection

## Prerequisites

- Node.js >= 18
- Yarn
- PostgreSQL

## Environment Variables

Buat file `.env` dari contoh:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Secret key untuk JWT |
| `SESSION_SECRET` | Secret untuk express-session |
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
| `CORS_ORIGIN` | Origin untuk CORS (default `http://localhost:3000`) |
| `FRONTEND_URL` | URL frontend untuk redirect & reset password |

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
| `yarn build` | Generate Prisma + build NestJS + tsc-alias |
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
| POST | `/api/auth/register` | - | Register user (auto role CUSTOMER) |
| POST | `/api/auth/login` | - | Login, return cookie `access_token` (encrypted) |
| POST | `/api/auth/logout` | - | Logout (hapus cookie) |
| POST | `/api/auth/storeowners` | SUPERADMIN | Create storeowner + optional store |
| GET | `/api/auth/google` | - | Redirect Google OAuth |
| GET | `/api/auth/google/callback` | - | Google OAuth callback |
| GET | `/api/auth/me` | JWT | Get current user |
| POST | `/api/auth/forgot-password` | - | Request reset password |
| POST | `/api/auth/reset-password` | - | Reset password |

### Stores

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/stores` | - | List active stores (sorted by distance if lat/lng) |
| GET | `/api/stores/:slug` | - | Detail store with products & distance |

### Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | JWT | List produk user (pagination + search) |
| POST | `/api/products` | JWT | Buat produk baru (auto-assign store untuk STOREOWNER) |
| GET | `/api/products/:id` | JWT | Detail produk |
| PATCH | `/api/products/:id` | JWT | Update produk |
| DELETE | `/api/products/:id` | JWT | Hapus produk |

### Cart

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/cart` | JWT | Lihat keranjang user |
| POST | `/api/cart/items` | JWT | Tambah item ke keranjang |
| PATCH | `/api/cart/items/:productId` | JWT | Update quantity item |
| DELETE | `/api/cart/items/:productId` | JWT | Hapus item dari keranjang |
| DELETE | `/api/cart` | JWT | Kosongkan keranjang |

### Transactions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/transactions` | JWT | Submit cart ke kasir |
| GET | `/api/transactions` | JWT | List antrian pending |
| POST | `/api/transactions/payment` | JWT | Bayar multiple transaksi (multi-payment) |
| POST | `/api/transactions/history` | JWT/CUSTOMER/SUPERADMIN/STOREOWNER | Riwayat transaksi |
| POST | `/api/transactions/:id/cancel` | JWT | Batalkan transaksi (PENDING only) |
| PATCH | `/api/transactions/:id/status` | STOREOWNER | Update status (IN_PROGRESS / DELIVERED) |
| GET | `/api/transactions/:id` | JWT | Detail transaksi + tracking timeline |
| GET | `/api/transactions/:id/tracking` | JWT | Tracking timeline |
| GET | `/api/transactions/admin/summary` | JWT | Admin summary dashboard |
| GET | `/api/transactions/store/orders` | STOREOWNER | Lihat order toko sendiri (pagination) |

### Payment Methods

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/payment-methods` | JWT | List metode pembayaran (static) |
| GET | `/api/payment-methods/:id` | JWT | Detail metode pembayaran |

### File Upload

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/file/upload` | JWT | Upload gambar (validasi magic bytes) ke Supabase |

### Coffee Assistant

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/coffee-assistant/generate` | JWT | Generate panduan brewing (dosis, grind, suhu, susu, foam) |
| GET | `/api/coffee-assistant/options` | JWT | List opsi dropdown (roast, strength, drink, milk, syrup) |

### AI Assistant

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/coffe-assistant` | - | Diagnosa & rekomendasi adjustment brewing via Google Gemini |

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/overview` | - | Overview stats + payment breakdown + revenue chart + top products |

## Database Schema

### Enums

| Enum | Values |
|---|---|
| `UserRole` | `SUPERADMIN` | `STOREOWNER` | `CUSTOMER` |
| `RoastLevel` | `LIGHT` | `MEDIUM` | `DARK` |
| `TransactionStatus` | `PENDING` | `PAID` | `IN_PROGRESS` | `DELIVERED` | `CANCELLED` |
| `TransactionAction` | `CREATED` | `ITEM_ADD` | `PAYMENT_STARTED` | `PAID` | `PAYMENT_FAILED` | `CANCELLED` | `STOCK_DEDUCTED` | `REFUNDED` | `IN_PROGRESS` | `DELIVERED` |
| `PaymentMethod` | `sopay` | `dana` | `gopay` | `qris` |

### Models

- **User** — `id`, `name`, `email` (unique), `password` (nullable), `role` (`SUPERADMIN`/`STOREOWNER`/`CUSTOMER`)
- **Store** — `id`, `name`, `slug` (unique), `description`, `address`, `phone`, `logoUrl`, `latitude`, `longitude`, `isActive`, `ownerId` → User
- **Product** — `id`, `name`, `description`, `origin`, `roastLevel`, `process`, `flavorNotes`, `price`, `stock`, `imageUrl[]`, `createdById`, `storeId` (nullable) → Store
- **Cart** — `id`, `userId` (unique) → User
- **CartItem** — `id`, `cartId` → Cart, `productId` → Product, `quantity` (unique combo `cartId` + `productId`)
- **Transaction** — `id`, `orderNumber` (unique), `total`, `status`, `createdById`, `storeId` (nullable) → Store, `paymentId` (nullable) → Payment
- **TransactionItem** — `id`, `quantity`, `price` (nullable), `productId` → Product, `transactionId` → Transaction
- **Payment** — `id`, `invoiceNumber` (unique), `totalAmount`, `method`, `paidAt`
- **TransactionLog** — `id`, `transactionId`, `action`, `message`, `meta` (JSON), `createdAt`
- **BlacklistedToken** — `id`, `token` (unique)
- **PasswordResetToken** — `id`, `token` (unique), `email`, `expiresAt`
- **Session** — `id`, `sid` (unique), `data`, `expiresAt` (untuk express-session store)
- **orderSequence** — `date` (PK), `value` (counter nomor order harian)

## Struktur Project

```
src/
├── auth/                  # Auth module
│   ├── config/            # Google OAuth config
│   ├── decorators/        # CurrentUser decorator
│   ├── dto/               # Register, Login, CreateStoreOwner DTOs
│   ├── interfaces/        # Auth request interfaces
│   └── strategies/        # JWT + Google OAuth strategies
├── common/
│   ├── decorators/        # @Roles() decorator
│   ├── guards/            # JwtGuard, JwtAuthGuard, RolesGuard, GoogleAuthGuard, JwtBlacklistGuard
│   ├── interceptors/      # ResponseInterceptor (wrap { success, status, message, data })
│   ├── multer/            # Multer config & file filter (image validation)
│   ├── types/             # Shared types (auth, JwtPayload, coffee types)
│   └── utils/             # ApiResponse helper, invoice/order number generators
├── file/                  # File upload module (Supabase)
├── lib/                   # Supabase client config
├── modules/
│   ├── ai/                # Google Gemini AI assistant (coffee diagnosis)
│   ├── cart/              # Shopping cart CRUD
│   ├── coffe/             # Coffee brewing guide generator
│   ├── dashboard/         # Dashboard analytics overview
│   ├── payment/           # Static payment methods
│   ├── product/           # Product CRUD per store/user
│   ├── store/             # Multi-store with Haversine distance
│   └── transaction/       # Transaction flow + tracking timeline
├── prisma/                # Prisma service, module, & session store
└── utils/                 # Crypto utils (AES-256-GCM), enum-to-options helper
```

## Seed Data

| Email | Password | Role |
|---|---|---|
| `superadmin@kopi.com` | `adminPassword` | SUPERADMIN |
| `customer@kopi.com` | `customerPassword` | CUSTOMER |
| `owner@kopi.com` | `ownerPassword` | STOREOWNER (dengan store "Kopiness Store") |

Sample products (5 Indonesian coffees) otomatis dibuat untuk storeowner.

## Auth Flow

1. **Register** → user langsung role `CUSTOMER`
2. **Login** → JWT dienkripsi AES-256-GCM, disimpan di httpOnly cookie (`access_token`)
3. **Setiap request** → cookie didecrypt, JWT diverifikasi, dicek blacklist
4. **Role-based** → `@Roles(SUPERADMIN)` guard di endpoint tertentu
5. **Create StoreOwner** → hanya SUPERADMIN yang bisa via `POST /auth/storeowners`

## Security

- **Cookie Encryption** — JWT dienkripsi AES-256-GCM sebelum dikirim ke client
- **JWT Blacklist** — Token bisa di-blacklist saat logout
- **Helmet** — Security headers
- **Rate Limiting** — 60 request/menit via ThrottlerGuard (global)
- **Image Validation** — Magic bytes verification sebelum upload
- **Password Hashing** — Argon2

## Testing

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e
```

## Deployment

Vercel — entry point via `api/index.js`:

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/(.*)", "destination": "/api/index" }
  ]
}
```

Pastikan semua environment variables diatur di Vercel dashboard.
