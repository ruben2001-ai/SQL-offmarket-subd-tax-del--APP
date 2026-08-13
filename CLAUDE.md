@AGENTS.md

# Land Leads Dashboard — Supabase notes

This app is the Supabase-backed dashboard for Ruben's off-market land lead
pipelines. It replaces manually re-opening the Excel outreach masters to
check status — the masters (or their CSV export) are the source of truth
for a *new* county/campaign's initial load; this app + Supabase are the
source of truth for day-to-day outreach state after that.

## Project

- Supabase project: `vynlsywztmbolhzxxsrl` (`https://vynlsywztmbolhzxxsrl.supabase.co`).
  Confirm with `get_project_url` before writing — this account has more than
  one Supabase project, don't assume.
- Two lead tables, `public.subdivide_outreach_leads` and
  `public.tax_delinquent_leads`, full schema in `src/lib/types.ts`
  (`Lead` / `TaxDelinquentLead`). Both carry `pipeline_stage`, RLS-gated to
  `authenticated` users only.
- `pipeline_stage` values (shared enum across both tables): `DNC / Leads /
  Potential Leads → Outreached → Responded → Qualified / Not Qualified →
  Underwriting → Offered → Follow-up → Accepted / Rejected / Long-term
  Follow-up`. DNC/Leads/Follow-up are legacy values kept for existing rows;
  new leads should move through Potential Leads → ... → Accepted/Rejected.
  This is the field the Pipeline Overview board groups by — keep it current
  as leads move through outreach.

## Working across two datasets

Don't hardcode a table name in app code — read it from `DATASETS[dataset].table`
(`src/lib/types.ts`) so both the Master Sheet and Pipeline tabs work for
whichever dataset is selected (`src/lib/dataset-context.tsx`). When adding a
third campaign/dataset later: add its row type + `DATASETS` entry in
`types.ts`, its column groups in `master-sheet-columns.tsx`, and its
owner/acreage/value/address mapping in `lead-adapter.ts` — the two tab
components shouldn't need dataset-specific branches beyond that.

## Outreach routine relationship

The actual send-side outreach (texting via Quo, reading replies, moving a
lead from "Not Contacted" → "Messaged" → …) is driven by the
`off-market-subdivide-outreach-cold-landowners` skill against the
`{County}_Outreach_Master.xlsx` file, and by `off-market-leads-builder` /
`subdivide-master-builder` for building a new county's master file. This
dashboard is not (yet) wired to write outreach state automatically — until
it is, keep it in sync by hand:

- After a texting/calling session, update the corresponding rows here
  (`outreach_status`, `contact_quality`, `response_date`, etc.) so the
  dashboard reflects what actually happened, or re-import an updated CSV
  export of the master.
- `tax_delinquent_leads.raw` holds the full LightBox property export
  (flood/slope/sale history/school district/skip-traced relatives, etc.) as
  JSONB — query specific fields with `raw->>'PROP: Field Name'` rather than
  adding new top-level columns for one-off lookups. Only promote a field to
  a real column if it's going to be filtered/sorted/edited from the UI
  regularly.

## Bulk data loads

For anything more than a handful of rows, don't try to push CSV/SQL text
through a chat context to the Supabase MCP tools — it hits practical size
limits fast (proven the hard way importing 473 tax-delinquent rows). Convert
to a CSV matching the target table's columns and import it directly via
Supabase Studio's Table Editor (**Insert → Import data from CSV**). See
README.md for the exact steps.
