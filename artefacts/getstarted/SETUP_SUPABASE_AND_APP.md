# DSA FlashMem — Setup Supabase and App from scratch

## Overview

This document explains step-by-step how to set up the DSA FlashMem application, including wiping and reinitializing Supabase (Cloud and Local), required environment variables, and verification steps.

Files added in this folder:

- [`artefacts/getstarted/SETUP_SUPABASE_AND_APP.md`](artefacts/getstarted/SETUP_SUPABASE_AND_APP.md:1) — this guide
- [`artefacts/getstarted/.env.example`](artefacts/getstarted/.env.example:1) — example environment variables
- [`artefacts/getstarted/schema.sql`](artefacts/getstarted/schema.sql:1) — schema creation script (tables)
- [`artefacts/getstarted/policies.sql`](artefacts/getstarted/policies.sql:1) — RLS policies and helper functions
- [`artefacts/getstarted/seed.sql`](artefacts/getstarted/seed.sql:1) — sample seed data

## Prerequisites

- Node.js 16+ and npm (or yarn). Verify with:

- `node -v` and `npm -v`

- Git: `git --version`

- Docker Desktop (for local Supabase) — install from https://www.docker.com

- Supabase CLI:
  - macOS (Homebrew): `brew tap supabase/cli && brew install supabase/cli`
  - npm: `npm install -g supabase`

- psql (Postgres client) — optional for CLI-driven SQL execution. Example (macOS): `brew install libpq` and then `brew link --force libpq`

- Supabase account (for Cloud) and access to Project API keys (anon & service_role)

## Quick checklist

1. Create Supabase project (Cloud) or start local Supabase (`supabase start`)
2. Backup existing database (if any)
3. Run `schema.sql`, then `policies.sql`, then `seed.sql`
4. Add environment variables from [`artefacts/getstarted/.env.example`](artefacts/getstarted/.env.example:1) to your hosting environment

## How to run the SQL scripts (recommended)

1) Use the Supabase Dashboard SQL Editor (Cloud): Open your project → SQL Editor → New Query → paste the SQL file content and Run. This is the easiest approach for Cloud.

2) Use psql with the project's connection string:

PGPASSWORD="<DB_PASSWORD>" psql "postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?sslmode=require" -f schema.sql

Notes:

- For Cloud operations that modify schema/RLS you should use an admin context (service_role key) when using API-based tools. When using psql, use the DB connection string from the Supabase Dashboard → Settings → Database → Connection string.

## Safe wipe and reinitialize — Supabase Cloud

WARNING: These actions are destructive. Backup before continuing.

1) Backup the database

- Use the Supabase Backups UI (Dashboard → Database → Backups) OR run:

PGPASSWORD="<DB_PASSWORD>" pg_dump -h <DB_HOST> -p <DB_PORT> -U <DB_USER> -F c -b -v -f ./backup.dump <DB_NAME>

2) Run the reset/wipe (recommended order)

- Option A (recommended): Use the Supabase SQL Editor and run the contents of [`artefacts/getstarted/schema.sql`](artefacts/getstarted/schema.sql:1), then run [`artefacts/getstarted/policies.sql`](artefacts/getstarted/policies.sql:1), then run [`artefacts/getstarted/seed.sql`](artefacts/getstarted/seed.sql:1).

- Option B (psql): Download the files locally and run:

PGPASSWORD="<DB_PASSWORD>" psql "postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?sslmode=require" -f artefacts/getstarted/schema.sql

PGPASSWORD="<DB_PASSWORD>" psql "postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?sslmode=require" -f artefacts/getstarted/policies.sql

PGPASSWORD="<DB_PASSWORD>" psql "postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?sslmode=require" -f artefacts/getstarted/seed.sql

3) Verify

- Run quick checks:

SELECT count(*) FROM profiles;

SELECT count(*) FROM flashcards;

SELECT count(*) FROM progress;

## Database Migrations

After setting up the initial schema, you should run the migration scripts located in the `migration` folder. These scripts make incremental changes to the database schema and should be run in numerical order.

For example:
`psql -f migration/01_audit_database.sql`
`psql -f migration/02_cleanup_data.sql`
`...and so on.`

## Safe wipe and reinitialize — Local (supabase CLI + Docker)

1) Start or stop local environment:

- Start: `supabase start`

- Stop: `supabase stop`

2) If you want a full local reset (clear volumes), stop the local supabase and remove volumes:

- `supabase stop`

- `docker compose -f supabase/docker-compose.yml down -v`  (if a `supabase/docker-compose.yml` exists) OR remove the named volumes created by the supabase CLI using `docker volume ls` and `docker volume rm <name>`.

3) Restart and apply SQL:

- `supabase start`

- Apply the SQL files using the local SQL Editor (if running Supabase Studio locally) or using psql pointed at the local connection string. If you prefer, exec into the Postgres container and run psql:

- `docker ps` → find the Postgres container (usually contains "supabase_db") and then:

- `docker exec -it <container_name> psql -U postgres -f /path/inside/container/schema.sql`

## Environment variables (`.env` / hosting)

Copy [`artefacts/getstarted/.env.example`](artefacts/getstarted/.env.example:1) to your project's root as `.env` or provide equivalent entries in your hosting provider's environment configuration.

Important variables:

- `VITE_SUPABASE_URL` — from Supabase Dashboard → API → Project URL

- `VITE_SUPABASE_ANON_KEY` — from Supabase Dashboard → API → anon key

- `VITE_OPENAI_MODEL` — optional (e.g., gpt-4o-mini)

- `VITE_OPENAI_API_KEY` — optional (for AI evaluation features)

Note: Never expose `service_role` keys in client-side environment variables. Use `service_role` only for server-side admin tasks or migrations.

## Row Level Security (RLS) notes

- The project uses RLS to restrict access to per-user data. The steps in [`artefacts/getstarted/policies.sql`](artefacts/getstarted/policies.sql:1) enable RLS and create policies that use `auth.uid()` comparisons.

- If you accidentally lock yourself out, run the emergency script: [`emergency-disable-rls.sql`](emergency-disable-rls.sql:1) (in the repository) in the Supabase SQL Editor to temporarily disable RLS and regain access.

## Backup and restore

- Backup with `pg_dump`:

PGPASSWORD="<DB_PASSWORD>" pg_dump -h <DB_HOST> -p <DB_PORT> -U <DB_USER> -F c -b -v -f ./backup.dump <DB_NAME>

- Restore with `pg_restore`:

PGPASSWORD="<DB_PASSWORD>" pg_restore -h <DB_HOST> -p <DB_PORT> -U <DB_USER> -d <DB_NAME> -v ./backup.dump

## Verification & smoke tests

1) Start the app:

- `npm install` (once)

- `npm run dev`

2) In the UI:

- Visit `http://localhost:5173`

- Sign up / log in with Supabase Auth (email). The app will create a profile row on first sign-in.

- Start review and confirm flashcards load, session creation, and progress updates.

3) Quick SQL checks (run in Supabase SQL Editor):

- `SELECT * FROM profiles LIMIT 5;`

- `SELECT * FROM flashcards LIMIT 5;`

- `SELECT * FROM progress LIMIT 5;`

## Troubleshooting

- 403/permission errors: check RLS policies. Use [`final-supabase-fix.sql`](final-supabase-fix.sql:1) or temporarily disable RLS using [`quick-fix-disable-rls.sql`](quick-fix-disable-rls.sql:1) / [`emergency-disable-rls.sql`](emergency-disable-rls.sql:1).

- AI evaluation not working: ensure `VITE_OPENAI_API_KEY` is configured and has access to the chosen model.

## Files included in this getstarted folder

- [`artefacts/getstarted/schema.sql`](artefacts/getstarted/schema.sql:1) — create tables

- [`artefacts/getstarted/policies.sql`](artefacts/getstarted/policies.sql:1) — RLS policies

- [`artefacts/getstarted/seed.sql`](artefacts/getstarted/seed.sql:1) — optional demo data

- [`artefacts/getstarted/.env.example`](artefacts/getstarted/.env.example:1) — example env

## Next steps

- After the DB is ready, run the app locally and confirm flows. For production, add keys to your hosting environment, and only expose anon keys to the client.

- If you want, I can create migration files or integrate this with a CI/CD pipeline.

## References

- Supabase Docs: https://supabase.com/docs

- Supabase CLI: https://supabase.com/docs/guides/cli

- Application README: [`README.md`](README.md:1)