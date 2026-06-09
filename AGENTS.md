# Session Log

## Project: Kopiness Migration Backend (`migrate-be-kopiness`)

### Stack
- **Runtime:** Node.js, NestJS 9.4.3
- **Language:** TypeScript 5.x
- **ORM:** Prisma 4.x (MySQL)
- **Auth:** JWT, Passport (Google OAuth), Supabase, Cookie-based Session
- **AI:** Google Gemini (`@google/genai` v2.8.0)
- **File:** Multer (upload), Prisma (session store)
- **Deploy:** Vercel (serverless), `tsc-alias` for path alias
- **Utils:** Swagger, Helmet, Class-validator, Argon2

### Architecture (src/)
| Path | Description |
|------|-------------|
| `auth/` | JWT + Google OAuth + Supabase auth |
| `modules/ai/` | AI service — Gemini integration for coffee adjustment |
| `modules/cart/` | Shopping cart CRUD |
| `modules/coffe/` | Coffee assistant — brew guide generator + problem diagnosis |
| `modules/dashboard/` | Dashboard analytics |
| `modules/payment/` | Payment processing |
| `modules/product/` | Product management |
| `modules/transaction/` | Transaction/tracking |
| `common/` | Guards, interceptors, types, decorators |
| `prisma/` | Prisma service + session store |
| `file/` | File upload |
| `lib/` | Library utils |
| `utils/` | Utility functions |

---

## Session — 5 Jun 2026

### Major auth overhaul — Role-based access (SUPERADMIN / STOREOWNER / CUSTOMER)

**Perubahan:**

1. **Prisma schema** — `UserRole` enum: `ADMIN | CUSTOMER` → `SUPERADMIN | STOREOWNER | CUSTOMER`
2. **New model `Store`** — relasi ke User (storeowner punya banyak store) + optional `storeId` di Product
3. **Register** — `role` field dihapus dari `RegisterDto`. User daftar otomatis jadi `CUSTOMER`
4. **New endpoint `POST /auth/storeowners`** — hanya SUPERADMIN yang bisa buat storeowner (dilindungi `JwtGuard` + `RolesGuard` + `@Roles(SUPERADMIN)`)
5. **`CreateStoreOwnerDto`** — `name`, `email`, `password`, optional `storeName` (store dibuat bareng)
6. **Seed** — `admin@kopi.com` → `superadmin@kopi.com` (SUPERADMIN), + sample storeowner (`owner@kopi.com`) + store
7. **Existing ADMIN users migrated** — via raw SQL ke `SUPERADMIN`
8. **Transaction** — `@Roles(UserRole.ADMIN)` → `@Roles(UserRole.SUPERADMIN)`

### Current state
- **Branch:** `master`
- **Changes:** semua file auth + prisma + seed, belum di-commit
- **DB:** sudah sync via `prisma db push`

### Pending / open items
- Storeowner management endpoint (list, update, delete) — kalau dibutuhkan

---

_This file is auto-updated by opencode agent. Add entries below as new sessions occur._
