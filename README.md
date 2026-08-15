# PRONOI

Procurement intelligence / procurement autopilot for small offline businesses.

PRONOI watches a business's inventory and demand, predicts stockout risk, recommends what and when to reorder, ranks suppliers by expected total cost (not just price), and can prepare and track purchase orders — with an AI copilot and a platform admin panel on top.

## Core Features

- Inventory risk monitoring
- Demand / stockout forecasting
- Reorder recommendations (deterministic safety-stock model)
- Risk-adjusted supplier comparison
- Purchase-order workflow (approve → track → deliver)
- Order tracking
- Simulation / stress testing (naive vs. PRONOI strategy, supplier disruption scenarios)
- Demand pooling across nearby businesses
- AI Copilot / voice agent
- Admin panel (categories, suppliers, auto-order rules, business types, regions, analytics)

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **Database:** PostgreSQL via Prisma ORM 7
- **Styling:** Tailwind CSS v4, shadcn/ui primitives
- **Validation:** Zod
- **Testing:** Vitest
- **AI:** DeepSeek API (decision explanations, copilot chat) — optional, degrades to deterministic fallback text if unset

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

The app ships with a seed script (`prisma/seed.ts`) that populates one demo business with realistic inventory, supplier, and pooling data, so the product is fully explorable without connecting real business systems. A scripted 4-step voice-agent demo is also included, backed by prerecorded audio narration over live, real backend actions (see `src/lib/pronoi/voice/`).

## Architecture

```
Data (Postgres via Prisma)
  → PRONOI Decision Engine (src/lib/pronoi/calc.ts, simulate.ts)
    → Server services (src/server/pronoi/*, src/server/admin/*)
      → Dashboard UI / Copilot / Admin panel
        → Purchase orders, demand pooling, simulations
```

Further backend setup and architecture notes: [`docs/PRONOI_BACKEND.md`](docs/PRONOI_BACKEND.md).
