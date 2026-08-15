/**
 * Points the DB-backed integration tests at a dedicated `pronoi_test`
 * database (migrated + seeded identically to the dev DB — see the README
 * section on running tests) instead of the real dev/demo database, so
 * `npm run test` never mutates the data you're using for a live demo.
 *
 * Override with TEST_DATABASE_URL if your local Postgres user/host differs.
 */
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://localhost:5432/pronoi_test?schema=public";
