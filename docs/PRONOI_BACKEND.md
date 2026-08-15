# PRONOI backend — setup & architecture

A persistent, Postgres-backed backend for the PRONOI dashboard. This is a
**hackathon backend with production-like architecture** — see "Known
limitations" at the end before treating it as production-ready.

## Setup

Prerequisites: PostgreSQL running locally (or any reachable Postgres instance).

```bash
# 1. Create the database
createdb pronoi

# 2. Configure environment
cp .env.example .env.local
# edit .env.local: set DATABASE_URL and (optionally) DEEPSEEK_API_KEY

# 3. Generate the Prisma client, apply the schema, seed demo data
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# 4. Run the app
npm run dev
```

`DATABASE_URL` format: `postgresql://USER@localhost:5432/pronoi?schema=public`
(add `:PASSWORD` after `USER` if your local Postgres requires one).

### Tests

Backend tests run against a **separate** `pronoi_test` database so `npm run
test` never touches the data you're using for a live demo:

```bash
createdb pronoi_test
DATABASE_URL="postgresql://USER@localhost:5432/pronoi_test?schema=public" npx prisma migrate deploy
DATABASE_URL="postgresql://USER@localhost:5432/pronoi_test?schema=public" npx tsx prisma/seed.ts
npm run test
```

Override the test DB connection with `TEST_DATABASE_URL` if your local
Postgres user differs from the OS default (see `src/test/setup.ts`).

### Resetting demo data

```bash
psql "$DATABASE_URL" -c 'TRUNCATE "AuditEvent", "SimulationRun", "PurchaseOrderItem", "PurchaseOrder", "Decision", "PoolingParticipant", "InventorySnapshot" CASCADE;'
npx tsx prisma/seed.ts
```

### Deploying (e.g. Vercel)

Prisma 7's `prisma-client` generator requires a driver adapter (`@prisma/adapter-pg`,
already wired in `src/server/db.ts`) rather than the classic bundled query
engine, which works cleanly in serverless/edge-style deployments. Set
`DATABASE_URL` (and `DEEPSEEK_API_KEY`) as environment variables in your
hosting provider, and run `npx prisma migrate deploy` (not `migrate dev`) as
part of your deploy step.

## Architecture

```
prisma/schema.prisma        Postgres schema (Business, Product, Supplier,
                             SupplierProduct, Decision, PurchaseOrder,
                             PoolingOpportunity, SimulationRun, AuditEvent, …)
prisma/seed.ts               Converts src/lib/pronoi/demoData.ts into DB rows
                             — the only place demo numbers are hand-typed.

src/server/db.ts             Shared Prisma Client singleton (pg driver adapter)
src/server/pronoi/
  business.ts                 getCurrentDemoBusiness() — the one seeded tenant
  decisions.ts                Core engine: computes + caches Decision snapshots,
                               approveDecision (transactional, idempotent),
                               rejectDecision
  inventory.ts, suppliers.ts  Read-side views over the same decision data
  orders.ts                   getOrders, advanceOrderStatus (validated
                               transitions, increments stock exactly once on
                               DELIVERED)
  pooling.ts                  getPoolingOpportunities, joinPoolingOpportunity
  simulations.ts              runWeeklyComparison, runStressTest — persists
                               SimulationRun for history/audit
  audit.ts                    writeAuditEvent / getAuditTrail
  actions.ts                  "use server" Server Actions — the only mutation
                               entry points, each Zod-validated
  adapters.ts                 Maps Prisma rows → the calc.ts/simulate.ts
                               input shapes (DemandInputs, SupplierOffer, …)
  errors.ts                   PronoiError + ActionResult — every Server
                               Action returns { ok, data } or { ok:false,
                               error } instead of throwing to the client

src/lib/pronoi/
  calc.ts, simulate.ts, stats.ts   UNCHANGED — the deterministic math engine.
                                    Pure functions, no I/O, safe to call from
                                    both the server layer above and the
                                    public landing page's demoData-based
                                    preview (src/lib/pronoi/decisions.ts,
                                    also unchanged, still powers the landing
                                    page only).
  orderStatus.ts                  Client-safe PurchaseOrder status constants
                                    (no Prisma import) — shared by the Orders
                                    UI stepper and the server's transition
                                    validator.
```

### Data flow

- **Reads**: dashboard pages are async Server Components that call the
  `src/server/pronoi/*` functions directly — no internal HTTP round-trip.
  Every page is `export const dynamic = "force-dynamic"` since it reads
  live, mutable DB state.
- **Writes**: client components call the Server Actions in `actions.ts`
  (`approveDecisionAction`, `rejectDecisionAction`, `advanceOrderStatusAction`,
  `joinPoolAction`, `runWeeklyComparisonAction`, `runStressTestAction`).
  Each validates input with Zod, calls the matching service function inside
  a Prisma transaction where relevant, calls `revalidatePath` on success,
  and returns `{ ok, data }` / `{ ok:false, error }` — never throws across
  the client/server boundary.
- **DeepSeek**: `/api/deepseek/explain` and `/api/deepseek/chat` remain
  Route Handlers (the Copilot widget calls them via `fetch`). Both now
  resolve their own context server-side from the database — the client
  only ever sends a `productId` or a chat message, never computed numbers.
  `DEEPSEEK_API_KEY` stays server-only. Deterministic engine output is
  always computed first; DeepSeek only phrases it, and a template fallback
  keeps every route working with the key unset or the API unreachable.

### Why some choices deviate slightly from a literal spec reading

- **No literal `GET /api/pronoi/*` REST routes.** Server Components already
  call the service layer directly, which is the more idiomatic App Router
  pattern and avoids a second, duplicate way to fetch the same data.
- **`SupplierProduct` (not `Supplier`) holds `onTimeRate`/`typicalDelayDays`.**
  The real demo data has the same-named supplier at different reliability
  for different products (e.g. Urban Supply is 82% on-time for cups, 92%
  for bottled water) — putting reliability on the relationship, not the
  supplier, is what preserves the actual numbers.
- **`RecoverySource` added as its own model.** Not in the spec's model list,
  but required to keep "inputs live in DB, outputs are computed" honest for
  the disruption/recovery scenario instead of leaving recovery sources as a
  hardcoded array.

## Known limitations

- **Single seeded tenant.** `getCurrentDemoBusiness()` always resolves the
  same `mokka-coffee` business — there's no real auth. This is intentional
  for the hackathon scope; every business-scoped function takes a
  `businessId` parameter so real auth can replace the resolver without
  touching the service layer.
- **PO number generation** counts existing rows inside the transaction; under
  genuinely concurrent approvals from *different* decisions it could very
  rarely produce a duplicate PO number, which would surface as a DB
  unique-constraint error on that specific request (not a silent duplicate).
  Not a concern for single-user demo use.
- **No rate limiting, request auth, or observability** beyond the AuditEvent
  table and console error logging.
- This is a **persistent hackathon backend with production-like
  architecture** — not a production-ready system.
