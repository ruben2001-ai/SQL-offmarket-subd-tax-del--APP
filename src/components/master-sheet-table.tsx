"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AnyLead, DatasetId, PipelineStage } from "@/lib/types";
import { DATASETS, PIPELINE_STAGES, PIPELINE_STAGE_COLORS, OUTREACH_STATUS_COLORS } from "@/lib/types";
import { useDataset } from "@/lib/dataset-context";
import {
  COLUMN_GROUPS_BY_DATASET,
  formatCell,
  telHref,
} from "@/lib/master-sheet-columns";

// Which fields the free-text search box checks, per dataset — the two tables
// name the equivalent owner/address/phone fields differently.
const SEARCH_FIELDS_BY_DATASET: Record<string, string[]> = {
  subdivide: [
    "owner_first_name",
    "owner_last_name",
    "apn",
    "parcel_address",
    "city",
    "phone_1",
    "phone_2",
    "email",
  ],
  tax_delinquent: [
    "owner_1_full_name",
    "owner_2_full_name",
    "apn",
    "parcel_full_address",
    "mail_full_address",
    "parcel_city",
    "phone_1",
    "phone_2",
    "email_1",
    "email_2",
  ],
};

export default function MasterSheetTable() {
  const { dataset } = useDataset();
  const table = DATASETS[dataset].table;

  // Remounting on `table` change (rather than resetting filter state inside
  // an effect) gives every dataset switch a clean slate for free.
  return <MasterSheetTableInner key={table} dataset={dataset} table={table} />;
}

function MasterSheetTableInner({
  dataset,
  table,
}: {
  dataset: DatasetId;
  table: string;
}) {
  const groups = COLUMN_GROUPS_BY_DATASET[dataset];
  const searchFields = SEARCH_FIELDS_BY_DATASET[dataset];

  const [leads, setLeads] = useState<AnyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [campaign, setCampaign] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setLeads((data ?? []) as AnyLead[]);
        setError(null);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [table]);

  const campaigns = useMemo(() => {
    const set = new Set(leads.map((l) => l.campaign).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [leads]);

  const statuses = useMemo(() => {
    const set = new Set(
      leads.map((l) => l.outreach_status).filter(Boolean) as string[],
    );
    return ["All", ...Array.from(set).sort()];
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (campaign !== "All" && l.campaign !== campaign) return false;
      if (statusFilter !== "All" && l.outreach_status !== statusFilter)
        return false;
      if (!q) return true;
      const row = l as unknown as Record<string, unknown>;
      const haystack = searchFields
        .map((key) => row[key])
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [leads, search, campaign, statusFilter, searchFields]);

  async function updatePipelineStage(id: string, stage: PipelineStage) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, pipeline_stage: stage } : l)),
    );
    const supabase = createClient();
    const { error } = await supabase
      .from(table)
      .update({ pipeline_stage: stage })
      .eq("id", id);
    if (error) {
      setError(`Failed to save pipeline stage: ${error.message}`);
    }
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <input
          type="search"
          placeholder="Search owner, APN, address, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
        />
        <select
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          {campaigns.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All campaigns" : c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All outreach statuses" : s}
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm text-slate-500">
          {loading ? "Loading…" : `${filtered.length} of ${leads.length} leads`}
        </span>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 sm:px-6">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="min-w-max border-separate border-spacing-0 text-xs">
          <thead className="sticky top-0 z-20">
            <tr>
              <th
                rowSpan={2}
                className="sticky left-0 z-30 min-w-[90px] border-b border-r border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold text-slate-700"
              >
                Campaign
              </th>
              <th
                rowSpan={2}
                className="sticky left-[90px] z-30 min-w-[160px] border-b border-r border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold text-slate-700"
              >
                Pipeline Stage
              </th>
              {groups.map((group) => (
                <th
                  key={group.label}
                  colSpan={group.columns.length}
                  className="border-b border-r border-slate-300 bg-slate-200 px-2 py-1 text-center font-semibold text-slate-700"
                >
                  {group.label}
                </th>
              ))}
            </tr>
            <tr>
              {groups.flatMap((group) =>
                group.columns.map((col) => (
                  <th
                    key={String(col.key)}
                    style={{ minWidth: col.width }}
                    className="border-b border-r border-slate-200 bg-slate-100 px-2 py-1 text-left font-medium text-slate-600 whitespace-nowrap"
                  >
                    {col.header}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead, i) => (
              <tr
                key={lead.id}
                className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
              >
                <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-inherit px-2 py-1 whitespace-nowrap">
                  {lead.campaign}
                </td>
                <td className="sticky left-[90px] z-10 border-b border-r border-slate-200 bg-inherit px-1 py-1">
                  <select
                    value={lead.pipeline_stage ?? "Leads"}
                    onChange={(e) =>
                      updatePipelineStage(
                        lead.id,
                        e.target.value as PipelineStage,
                      )
                    }
                    style={{
                      borderLeftColor:
                        PIPELINE_STAGE_COLORS[
                          (lead.pipeline_stage as PipelineStage) ?? "Leads"
                        ],
                    }}
                    className="w-full rounded border border-slate-300 border-l-4 bg-white px-1 py-0.5 text-xs font-medium text-slate-700"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                {groups.flatMap((group) =>
                  group.columns.map((col) => {
                    const value = (lead as unknown as Record<string, unknown>)[
                      col.key
                    ];
                    const isStatus = col.key === "outreach_status";
                    const statusClass =
                      isStatus && value
                        ? OUTREACH_STATUS_COLORS[value as string]
                        : "";
                    if (col.kind === "link" && value) {
                      return (
                        <td
                          key={String(col.key)}
                          className="border-b border-r border-slate-200 px-2 py-1 whitespace-nowrap"
                        >
                          <a
                            href={value as string}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-600 underline hover:text-sky-800"
                          >
                            Link
                          </a>
                        </td>
                      );
                    }
                    if (col.kind === "phone" && value) {
                      return (
                        <td
                          key={String(col.key)}
                          className="border-b border-r border-slate-200 px-2 py-1 whitespace-nowrap"
                        >
                          <a
                            href={telHref(value as string)}
                            className="text-sky-600 hover:underline"
                          >
                            {formatCell("phone", value)}
                          </a>
                        </td>
                      );
                    }
                    if (col.kind === "email" && value) {
                      return (
                        <td
                          key={String(col.key)}
                          className="border-b border-r border-slate-200 px-2 py-1 whitespace-nowrap"
                        >
                          <a
                            href={`mailto:${value}`}
                            className="text-sky-600 hover:underline"
                          >
                            {value as string}
                          </a>
                        </td>
                      );
                    }
                    return (
                      <td
                        key={String(col.key)}
                        className={`border-b border-r border-slate-200 px-2 py-1 whitespace-nowrap ${statusClass}`}
                      >
                        {formatCell(col.kind, value)}
                      </td>
                    );
                  }),
                )}
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={2 + groups.flatMap((g) => g.columns).length}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No leads match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
