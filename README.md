# TigerOps

A secure, role-based **Sales Intelligence & DSR Email Platform** for a freight forwarding company.

Built with Next.js 14, TypeScript, Prisma, and Neon PostgreSQL.

## Features

- **Role-based access** — Admin, Sales Manager, CS Staff with enforced route protection
- **Sales Portal** — CRUD sales entries, quarterly dashboards, Excel import with column mapping
- **DSR Module** — Create/edit/send Daily Shipment Reports via email (Resend integration)
- **Admin Dashboard** — KPI cards, revenue charts, manager leaderboard, user management
- **Auth** — NextAuth v5 with JWT sessions, forced password change on first login
- **Responsive** — Mobile sidebar, top header bar, skeleton loading states

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 6 |
| Auth | NextAuth.js v5 (beta) |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Email | Resend + React Email |
| Excel | SheetJS (xlsx) |
| Toast | Sonner |

## Local Setup

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A PostgreSQL database (e.g., [Neon](https://neon.tech))

### 1. Clone & Install

```bash
git clone https://github.com/Monkey-D-luffy-beep/Project-X.git
cd Project-X
pnpm install
```

### 2. Environment Variables

Create `.env.local` in the root:

```env
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_xxxxxxxxxxxx"
```

Create `prisma/.env`:

```env
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
```

### 3. Database Setup

```bash
npx prisma db push      # Create tables
npx prisma db seed       # Seed users (1 admin + 14 sales managers + 3 CS staff)
```

### 4. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tigerops.in | Admin@123 |
| Sales Manager | rakhi@tigerops.in | Tiger@2025 |
| CS Staff | cs1.rakhi@tigerops.in | Tiger@2025 |

> All users have `mustChangePassword: true` by default (except admin). They'll be forced to set a new password on first login.

## Project Structure

```
app/
├── (auth)/              # Login & change-password pages
├── dashboard/           # Protected dashboard routes
│   ├── admin/           # Admin dashboard + user management
│   ├── dsr/             # DSR list, create, edit
│   └── sales/           # Sales dashboard + Excel import
├── api/                 # API routes
│   ├── admin/           # Dashboard & user CRUD
│   ├── auth/            # NextAuth + password change
│   ├── dsr/             # DSR CRUD + send email
│   └── sales/           # Sales entry CRUD + batch import
components/              # Shared UI components
prisma/                  # Schema + seed
```

## Build

```bash
npx next build
```
