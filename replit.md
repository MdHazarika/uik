# Workspace

## Overview

BarbrGo — a full-stack barber booking platform (like hotel/bus booking but for barbers). Built with pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/barbrgo) — served at `/`
- **API framework**: Express 5 (artifacts/api-server) — served at `/api`
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── barbrgo/            # React + Vite frontend (BarbrGo web app)
│   └── api-server/         # Express API server
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
└── scripts/                # Utility scripts
```

## BarbrGo Features

### User Features
- User registration and login (email/password)
- Search barbers by city, area, date, time
- Filter by price, rating, experience, distance, home service
- Barber profile with services, reviews, availability slots
- Smart slot booking with auto-calculation of next slot

### Service Booking
- Select services (haircut, shave, beard, combo, etc.)
- Each service has fixed duration
- Slot booking prevents double-booking
- Home service option with extra charges

### Booking System
- Create bookings with multiple services
- Automatic end-time calculation
- Coupon code / discount validation
- Online and cash payment options
- Cancel bookings with reason

### Dashboards
- `/dashboard/user` — User bookings, loyalty points
- `/dashboard/barber` — Barber schedule, earnings, pending bookings
- `/dashboard/barber/services` — Manage services
- `/admin` — Platform stats, revenue, users, bookings

### Other Features
- Reviews and ratings (1-5 stars, only verified users)
- Offers/coupons (percentage, fixed, first-time, time-limited)
- Active offers page with coupon codes

## Database Schema

Tables:
- `users` — customers, barbers, admins
- `shops` — barber shops
- `barbers` — barber profiles (linked to users/shops)
- `service_types` — master list of service categories
- `services` — barber-specific services with pricing
- `bookings` — booking records with status
- `reviews` — ratings and comments
- `offers` — discount coupons

## Demo Accounts (password for all: `123`)

- Admin: admin@barbrgo.com
- Customer: rahul@example.com, priya@example.com
- Barbers: amit@barbrgo.com, vikram@barbrgo.com, ravi@barbrgo.com, etc.

## API Routes

All routes prefixed with `/api`:
- `/auth/*` — register, login, logout, me
- `/users/:id` — user profile and bookings
- `/barbers` — list/filter barbers
- `/barbers/:id` — barber profile, availability, services, bookings, reviews, dashboard, earnings
- `/shops` — shop listing
- `/services` — service types
- `/bookings` — create/update/cancel bookings
- `/reviews` — create/delete reviews
- `/offers` — active offers, coupon validation
- `/admin/*` — stats, users, bookings, revenue
- `/dashboard/*` — platform summary, cities

## Packages

### `artifacts/barbrgo` (`@workspace/barbrgo`)
React + Vite frontend served at `/`. Uses React Query hooks from `@workspace/api-client-react`.

### `artifacts/api-server` (`@workspace/api-server`)
Express 5 API server. Routes in `src/routes/`.

### `lib/db` (`@workspace/db`)
Database layer with Drizzle ORM and PostgreSQL schema definitions.

### `lib/api-spec` (`@workspace/api-spec`)
OpenAPI 3.1 spec + Orval config. Run `pnpm --filter @workspace/api-spec run codegen` to regenerate.
