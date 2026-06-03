# DistriFlow — Sales & Distribution Management System

A complete Sales & Distribution (S&D) platform for digitizing SME ecosystems — inspired by SalesOn functionality with a unique modern UI.

## Features

- **Dashboard** — Real-time KPIs, sales charts, leaderboard, attendance summary
- **Sales Orders** — Route-wise orders with digital catalog, discounts & stock validation
- **Invoices & GST** — Automatic invoicing (Sales, Purchase, Estimate, DC) with A4/A5/Thermal
- **Payment Collection** — On-the-go collection with approval workflow & outstanding reports
- **Van Sales** — Van inventory load in/out, EOD summary, thermal printing ready
- **Live Tracking** — Real-time sales rep location on Google Maps with navigation
- **Attendance** — Geo-tagged check-in/out with overtime/undertime tracking
- **Route Planner** — Route management with route-based access control
- **Inventory** — Real-time stock with custom fields (Size, Color, Batch No)
- **Target Meter** — KPI breakdown, leaderboards & gamification
- **Production** — Multilevel BOM, work orders, quality check & cost tracking
- **Purchases** — Purchase order management
- **Business Reports** — Revenue trends, top products, outlet-wise outstanding
- **Settings** — Highly configurable permissions, defaults & Tally integration
- **Support** — Customer support ticket system

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + Recharts + Lucide Icons
- **Backend:** Node.js + Express + MongoDB + JWT Auth
- **Design:** Unique indigo/emerald glass-morphism UI (Outfit + JetBrains Mono fonts)

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Setup

```bash
# Install all dependencies
npm run install-all

# Seed demo data
npm run seed

# Start development (server + client)
npm run dev
```

- **Frontend:** http://localhost:3020
- **Backend API:** http://localhost:5010

### Demo Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@distriFlow.com | admin123 |
| Manager | manager@distriFlow.com | manager123 |
| Sales Rep | amit@distriFlow.com | sales123 |
| Sales Rep | priya@distriFlow.com | sales123 |

## Project Structure

```
Reatiler CRM/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── pages/       # All module pages
│       ├── components/  # Layout, common UI
│       ├── context/     # Auth context
│       └── api/         # Axios instance
├── server/          # Express backend
│   ├── models/      # Mongoose schemas
│   ├── controllers/ # Route handlers
│   ├── routes/      # API routes
│   └── seed.js      # Demo data seeder
└── package.json     # Root scripts
```

## API Endpoints

| Module | Endpoint |
|--------|----------|
| Auth | `/api/auth/login`, `/api/auth/register` |
| Dashboard | `/api/dashboard/stats`, `/api/dashboard/leaderboard` |
| Outlets | `/api/outlets` |
| Products | `/api/products` |
| Routes | `/api/routes` |
| Orders | `/api/orders` |
| Invoices | `/api/invoices` |
| Payments | `/api/payments` |
| Inventory | `/api/inventory` |
| Attendance | `/api/attendance/check-in`, `/api/attendance/check-out` |
| Tracking | `/api/tracking/live` |
| Van Sales | `/api/van-sales` |
| Targets | `/api/targets` |
| Production | `/api/production` |
| Settings | `/api/settings`, `/api/settings/tally-sync` |

## License

MIT
