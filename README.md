# AutoKos v2 — Production-Ready Car Rental Platform

**Full-stack, database-driven rent-a-car web application for Prishtina, Kosovo.**  
Next.js 15 · TypeScript · PostgreSQL · Prisma · NextAuth v5 · Tailwind CSS

---

## ✅ What's Included

| Area | Status |
|------|--------|
| Public website (15+ pages) | ✅ Complete |
| Auth (register, login, forgot/reset password) | ✅ Complete |
| Password change for logged-in users | ✅ Complete |
| Booking engine with collision-safe retry | ✅ Complete |
| Full booking lifecycle (PENDING → CONFIRMED → IN_PROGRESS → COMPLETED) | ✅ Complete |
| Booking status history / audit trail | ✅ Complete |
| Customer cancellation with policy check | ✅ Complete |
| Customer dashboard (bookings, profile, security) | ✅ Complete |
| Admin dashboard (12 sections) | ✅ Complete |
| Fleet management CRUD | ✅ Complete |
| Booking management with lifecycle actions | ✅ Complete |
| User management | ✅ Complete |
| Locations CRUD | ✅ Complete |
| Extras/Services CRUD | ✅ Complete |
| Offers/Promotions CRUD | ✅ Complete |
| Reviews/Testimonials CRUD | ✅ Complete |
| FAQ management | ✅ Complete |
| Legal pages (editable from admin) | ✅ Complete |
| Site settings (all admin-editable) | ✅ Complete |
| Media library with upload | ✅ Complete |
| Centralised pricing service | ✅ Complete |
| Email notifications (confirmation, status changes, reset) | ✅ Complete |
| SEO metadata management | ✅ Complete |
| Role-based access control | ✅ Complete |

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- **Node.js 18+** (`node -v`)
- **PostgreSQL** running locally, or a cloud URL (Neon.tech free tier works)

### 1. Install
```bash
npm install
```

### 2. Environment
```bash
cp .env.example .env
```

Edit `.env` — minimum required:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/autokos"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Email is optional in development — if not configured, emails are logged to console.

### 3. Database
```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:seed       # Seed with demo data (cars, bookings, users, content)
```

### 4. Run
```bash
npm run dev
```

Open **http://localhost:3000**

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@autokos.com` | `Admin@123456` |
| **Customer** | `john.doe@example.com` | `Customer@123` |
| **Customer** | `besa.berisha@gmail.com` | `Customer@123` |

Admin panel: **http://localhost:3000/admin/dashboard**

---

## 📁 Project Structure

```
autokos/
├── prisma/
│   ├── schema.prisma          # 18 database models with indexes
│   └── seed.ts                # Realistic Kosovo demo data
├── src/
│   ├── auth.ts                # NextAuth v5 — JWT credentials auth
│   ├── middleware.ts          # Route protection (admin/customer/guest)
│   ├── lib/
│   │   ├── pricing.ts         # Centralised pricing service
│   │   ├── email.ts           # Email service (templates + transport)
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── utils.ts           # Shared helpers
│   │   └── validations/
│   │       ├── auth.ts        # Auth/profile Zod schemas
│   │       └── booking.ts     # Booking + car Zod schemas
│   ├── app/
│   │   ├── (public)/          # Homepage, fleet, booking, info pages
│   │   ├── (auth)/            # Login, register, forgot/reset password
│   │   ├── (customer)/        # Dashboard, bookings, profile, security
│   │   ├── (admin)/           # Full admin panel
│   │   └── api/               # 27 REST endpoints
│   └── components/
│       ├── admin/             # Admin UI components
│       ├── booking/           # Booking form + cancellation
│       ├── cars/              # Car cards, fleet listing
│       ├── home/              # Homepage sections
│       ├── layout/            # Header, Footer
│       └── pages/             # FAQ, Legal content
└── public/
    └── uploads/               # Local media uploads (dev)
```

---

## 🛡️ Security

- Passwords hashed with **bcryptjs** (12 rounds)
- JWT sessions via **NextAuth v5**
- All admin API routes verify role server-side — no frontend-only guards
- Booking creation uses **database transactions** with race condition re-check
- Booking reference collisions handled with **retry loop** (5 attempts)
- Status transitions are **validated** — invalid transitions return 400
- All inputs validated with **Zod** on both client and server
- TypeScript strict mode throughout

---

## 🔄 Booking Lifecycle

```
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
       ↓           ↓              ↓
   REJECTED     CANCELLED      NO_SHOW
```

Every transition is recorded in `BookingStatusHistory`.  
Customers can cancel PENDING/CONFIRMED bookings.  
Admin can trigger all transitions with optional reason (sent to customer via email).

---

## 💰 Pricing Logic

All pricing goes through `src/lib/pricing.ts`:

1. **Duration resolved first** → determines tier (daily / weekly / monthly)
2. **Extras calculated** per their pricing type (per day / per booking / one-time)  
3. **Location fees** added (pickup fee + drop-off fee if one-way)
4. **Discount** subtracted
5. **Total** snapshotted on booking — never recalculated after creation

---

## 📧 Email Configuration

Emails work in development without configuration (logged to console).

For production, add SMTP settings to `.env`. Recommended providers:
- **Resend** (resend.com) — 3,000 free emails/month, excellent deliverability
- **Mailgun** — 5,000 free/month for 3 months
- **Gmail** — App Password required (not regular password)

---

## 🗄️ Database Management

```bash
npm run db:studio        # Open Prisma Studio (visual DB editor)
npm run db:reset         # Reset DB + re-seed (DESTROYS ALL DATA)
npm run db:migrate       # Create a new migration
npm run db:push          # Push schema without migration (dev only)
```

---

## 🚢 Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables (from `.env.example`)
4. Deploy

**Recommended production database:** [Neon.tech](https://neon.tech) (free PostgreSQL)  
**Recommended email:** [Resend](https://resend.com) (free 3k/month)

```bash
# Production build test locally
npm run build
npm start
```

---

## 📋 NPM Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run type-check` | TypeScript check without build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Sync schema to DB (dev) |
| `npm run db:migrate` | Create migration (production) |
| `npm run db:seed` | Load demo data |
| `npm run db:reset` | Reset + reseed (⚠ destructive) |
| `npm run db:studio` | Visual DB editor |

---

## 🔧 Admin Panel Guide

### Key URLs
| Section | URL |
|---------|-----|
| Dashboard | `/admin/dashboard` |
| Fleet | `/admin/cars` |
| Bookings | `/admin/bookings` |
| Users | `/admin/users` |
| Settings | `/admin/settings` |

### Normal Business Operations (No Code Needed)
- Add/edit/remove cars → **Admin → Fleet**
- Change prices → **Admin → Fleet → Edit Car**
- Manage bookings → **Admin → Bookings**
- Edit FAQs → **Admin → FAQ**
- Edit legal pages → **Admin → Legal Pages**
- Update contact info/business settings → **Admin → Settings**
- Add offers/promo codes → **Admin → Offers**
- Manage testimonials → **Admin → Reviews**

---

## v2 Changelog (from v1)

### 🔴 Critical Fixes
- Removed 20 unused Radix UI packages that caused install conflicts
- Removed unused `react-day-picker`, `sharp` from dependencies
- Fixed `date-fns` version incompatibility (v4 → v3)
- Fixed duplicate `type LoginValues` declaration causing TypeScript error
- Fixed all auth page type imports to use exported types from validations

### 🟠 Architecture Improvements
- Added centralised `src/lib/pricing.ts` — all pricing logic extracted from routes
- Hardened booking reference generation with 5-attempt retry loop
- Booking creation now uses proper DB transaction with race-condition re-check
- Added `BookingStatusHistory` model — every status change is recorded
- Added full booking lifecycle fields: `pickedUpAt`, `returnedAt`, `rejectedAt`, `damageNoted`, `depositReturned`, etc.
- Added valid status transition enforcement (prevents invalid state jumps)

### 🟡 Feature Completions
- Customer password change page + API (`/dashboard/security`)
- Customer booking cancellation flow with policy check (48hr rule)
- Booking status timeline visible to customers
- Admin booking detail shows full status history
- Admin can mark pickup, return, no-show, reject with reasons
- Booking notes editor (internal notes + admin-only notes)
- Email service now sends status change emails (confirmed, cancelled, rejected, completed)
- Contact form now notifies admin via email
- Added `ADMIN_EMAIL` env variable for admin notifications

### 🟢 Quality
- All auth pages use proper typed imports from validation files
- Removed all `z.infer` local type re-declarations
- Schema indexes added for performance on bookings, users, activity logs
- `.env.example` fully documented with all variables and examples
- README fully updated to match actual project
