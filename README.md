# PRONOI

**A procurement autopilot for small offline businesses.** PRONOI watches inventory and demand, predicts stockouts before they happen, tells you exactly what to order and from whom — and can act on that recommendation itself, by voice, in real time.

[![Live Demo](https://img.shields.io/badge/demo-pronoi.vercel.app-black?style=flat-square)](https://pronoi.vercel.app)
[![CI](https://img.shields.io/github/actions/workflow/status/L4RBIX/PRONOI/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/L4RBIX/PRONOI/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)](LICENSE)

**→ [pronoi.vercel.app](https://pronoi.vercel.app)** — live, seeded with real demo data, nothing to install.

---

## The problem

A small coffee shop, bakery, or pharmacy runs on a spreadsheet and a gut feeling. Nobody is watching demand trends closely enough to catch a stockout two days before it happens. Nobody is comparing suppliers on anything but sticker price — so "the cheap one" quietly costs more once a late delivery wipes out a day of sales. And every reorder decision is a manual, repeated chore.

## What PRONOI does

PRONOI is the operations layer that watches this for you:

- **Predicts stockouts before they happen**, using a real statistical model (normal demand-during-lead-time, safety stock, service-level targets) — not a black box, and not a guess.
- **Ranks suppliers by expected total cost, not price.** A supplier that's 7% cheaper but late 30% of the time can cost *more* once the risk of that delay is priced in — PRONOI shows you the math, not just a verdict.
- **Pools demand across nearby businesses** to unlock volume discounts none of them could reach alone.
- **Simulates the week ahead** — naive reordering vs. PRONOI's strategy, or a supplier-disruption stress test — before you commit to anything.
- **Acts on its own recommendations**, through a Russian-language voice agent that listens, reasons over your real inventory data, prepares a purchase, asks for explicit confirmation, and only then creates the real order.

None of this is a mockup. Every number on the dashboard is computed live from a Postgres-backed decision engine — approve a purchase and it becomes a real order with a real status timeline; edit a supplier's reliability in the admin panel and every dashboard number that depends on it recomputes on the next page load.

## Why it's different

| | Typical procurement tooling | PRONOI |
|---|---|---|
| Reorder timing | Manual, reactive | Predicted from a real demand model, before the stockout |
| Supplier choice | Lowest price wins | Risk-adjusted expected total cost |
| Volume discounts | Only if you're big enough alone | Pooled across nearby businesses |
| "What if" planning | Spreadsheet guesswork | Deterministic weekly + disruption simulation |
| Interface | Forms and tables only | A voice agent that inspects real state and takes real, confirmed actions |
| Scaling to new regions/business types | Hardcoded | A platform admin panel — categories, supplier templates, auto-order rules, business-type profiles, regions |

## Features

**Business dashboard**
- Inventory risk monitoring, ranked by urgency
- Stockout forecasting with a transparent, inspectable causal chain
- Reorder recommendations sized to a target service level
- Risk-adjusted supplier comparison (purchase cost + expected delay cost)
- Purchase-order workflow — approve → sent → confirmed → in transit → delivered
- Demand pooling with tiered volume discounts
- Weekly and disruption-scenario simulation
- An AI copilot, and a scripted Russian voice-agent demo that drives the app end-to-end

**Platform admin panel**
- Product categories, with default units and service levels
- Supplier templates — the same records the decision engine reads, so edits here change real recommendations
- Auto-order rules per business type × category, feeding the live safety-stock calculation
- Business-type profiles (recommended tooling, default categories, seasonality)
- Multi-tenant business inspection view
- Platform analytics (clearly labeled where a number is a demo simulation, not a real historical outcome)
- Region/scalability configuration

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **Database:** PostgreSQL via Prisma ORM 7
- **Styling:** Tailwind CSS v4, shadcn/ui primitives
- **Validation:** Zod
- **Testing:** Vitest
- **AI:** DeepSeek API (decision explanations, copilot chat) — optional, degrades to deterministic fallback text if unset
- **Deployment:** Vercel + Neon Postgres

## Local Development

Prerequisites: Node.js 24+, a local PostgreSQL instance.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# edit .env.local — set DATABASE_URL, optionally DEEPSEEK_API_KEY

# 3. Create the database
createdb pronoi

# 4. Generate the Prisma client, apply the schema, seed demo data
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# 5. Run the app
npm run dev
```

Other useful commands:

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # production build
npm run test        # Vitest (see docs/PRONOI_BACKEND.md for the separate test database setup)
npm run check        # lint + typecheck + build
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DEEPSEEK_API_KEY` | No | Enables AI-generated decision explanations and copilot chat; without it, the app falls back to deterministic template text |

See `.env.example` for the exact format. Never commit real values.

## Demo

The app ships with a seed script (`prisma/seed.ts`) that populates one demo business with realistic inventory, supplier, and pooling data, so the product is fully explorable without connecting real business systems.

A scripted, two-click voice-agent demo is also included: click the mic, speak, click again to send. Speech recognition is intentionally out of scope for the demo script — what *is* real is everything downstream of it. Each step inspects live inventory/supplier data, navigates the actual dashboard, and — on the final confirmed step — creates a real purchase order through the same code path the "Approve purchase" button uses. Narration plays over the real actions from four prerecorded audio lines (see `src/lib/pronoi/voice/`). A "Reset demo" control (dashboard sidebar) restores the demo tenant to its pristine seeded state for repeat rehearsal.

## Architecture

```
Data (Postgres via Prisma)
  → PRONOI Decision Engine (src/lib/pronoi/calc.ts, simulate.ts)
    → Server services (src/server/pronoi/*, src/server/admin/*)
      → Dashboard UI / Copilot / Admin panel
        → Purchase orders, demand pooling, simulations
```

Further backend setup and architecture notes: [`docs/PRONOI_BACKEND.md`](docs/PRONOI_BACKEND.md).

## License

MIT — see [`LICENSE`](LICENSE).
