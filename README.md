# Land Leads Dashboard

Next.js + Supabase dashboard for Ruben's off-market land lead pipelines. Two
datasets, one app: **Off-Market Subdivide** leads and **NC Tax Delinquent**
leads, switchable from the header. Each dataset gets a **Master Sheet** tab
(a filterable, editable mirror of the outreach Excel master) and a
**Pipeline Overview** tab (KPI tiles + a kanban-style board across
`pipeline_stage`).

## Stack

- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS
- Supabase (Postgres + Auth). Client-side reads/writes via `@supabase/ssr`,
  RLS-gated to authenticated users.

## Getting started

```bash
npm install
```

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://vynlsywztmbolhzxxsrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable/anon key from Supabase project settings>
```

These are public, client-safe values (RLS does the actual access control) —
see [Supabase's docs](https://supabase.com/docs/guides/api/api-keys) if you
need to fetch them again.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). There's no seeded
account — use the **sign-up** option on the login page to create the first
one; Supabase Auth handles the rest.

## Data model

Two independent tables in the same Supabase project, both with a
`pipeline_stage` column (`DNC → Leads → Outreached → Underwriting → Offered →
Follow-up → Accepted / Rejected / Long-term Follow-up`) and RLS restricted to
`authenticated` read/write:

- **`subdivide_outreach_leads`** — off-market subdivide-candidate parcels,
  cold-landowner SMS/email outreach (see `off-market-subdivide-outreach-cold-landowners`
  skill for the day-to-day routine that populates/updates this table).
- **`tax_delinquent_leads`** — NC tax-delinquent parcel owners. Curated
  columns cover contact info, mailing/parcel address, tax & value, phones
  1–7, and outreach/offer/call tracking (same shape/conventions as the
  subdivide table). Everything else from the source LightBox export (flood
  zone, slope/buildability, sale history, school district, skip-traced
  relative contacts, etc.) lives losslessly in the `raw` JSONB column —
  query it with `raw->>'PROP: Field Name'`.

`src/lib/types.ts` defines both row shapes (`Lead`, `TaxDelinquentLead`) and
the `DATASETS` config map. `src/lib/dataset-context.tsx` holds which dataset
is active (persisted to `localStorage`, switched via the header dropdown);
`src/lib/lead-adapter.ts` normalizes the handful of fields (owner name,
acreage, value, address) that differ in name between the two tables so the
Pipeline tab's KPIs/cards work against either dataset without branching
everywhere.

## Bulk-loading a new outreach master into Supabase

The SQL MCP path chokes on payloads this size (500+ columns × hundreds of
rows). The reliable path is Supabase Studio's own CSV importer:

1. Convert the outreach master `.xlsx` to a CSV whose header row matches the
   target table's column names exactly (see `tax_delinquent_leads` for the
   pattern: curated columns + a catch-all `raw` JSONB column holding
   everything else as JSON text).
2. Supabase dashboard → **Table Editor** → select the table → **Insert** →
   **Import data from CSV** → upload → confirm the column mapping → Import.
3. Verify row count matches the source sheet(s).

## Deploying

Localhost is fine while the dashboard is still being built out. When it's
ready to be a daily tool: connect the repo to Vercel and set
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` as project env
vars there (same values as `.env.local`) — Next.js's own platform, deploys
on every push.
