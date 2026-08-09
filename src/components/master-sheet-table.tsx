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
  type Column,
  type ColumnKind,
} from "@/lib/master-sheet-columns";

type SortDir = "asc" | "desc";

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 inline-block w-2.5 text-slate-300">↕</span>;
  return <span className="ml-1 inline-block w-2.5 text-slate-900">{dir === "asc" ? "↑" : "↓"}</span>;
}

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

const COLUMN_ORDER_STORAGE_PREFIX = "master-sheet-column-order:";

function MasterSheetTableInner({
  dataset,
  table,
}: {
  dataset: DatasetId;
  table: string;
}) {
  const groups = COLUMN_GROUPS_BY_DATASET[dataset];
  const searchFields = SEARCH_FIELDS_BY_DATASET[dataset];

  // Flat column list, group boundaries dropped in favor of free horizontal
  // reordering — this is the "default order" the reset button restores.
  const defaultColumns = useMemo(() => groups.flatMap((g) => g.columns), [groups]);
  const columnsByKey = useMemo(() => {
    const map: Record<string, Column> = {};
    for (const c of defaultColumns) map[c.key] = c;
    return map;
  }, [defaultColumns]);
  const storageKey = COLUMN_ORDER_STORAGE_PREFIX + table;

  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    defaultColumns.map((c) => c.key),
  );
  const [dragKey, setDragKey] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const keys: string[] = JSON.parse(stored);
      const known = new Set(defaultColumns.map((c) => c.key));
      const valid = keys.filter((k) => known.has(k));
      // Any column added to the schema since the order was saved gets
      // appended at the end rather than silently dropped.
      const missing = defaultColumns.map((c) => c.key).filter((k) => !valid.includes(k));
      // One-time restore of a persisted UI preference on mount — this component
      // already remounts fresh per dataset (key={table} in the parent), so this
      // never re-runs mid-session; it's the SSR-safe alternative to a lazy
      // useState initializer, which would read localStorage during server
      // render (where it doesn't exist) and mismatch on hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (valid.length) setColumnOrder([...valid, ...missing]);
    } catch {
      // ignore malformed storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const columns = useMemo(
    () => columnOrder.map((k) => columnsByKey[k]).filter(Boolean),
    [columnOrder, columnsByKey],
  );

  function moveColumn(key: string, overKey: string) {
    if (key === overKey) return;
    setColumnOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(key);
      const to = next.indexOf(overKey);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, key);
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function resetColumnOrder() {
    const order = defaultColumns.map((c) => c.key);
    setColumnOrder(order);
    window.localStorage.removeItem(storageKey);
  }

  const [leads, setLeads] = useState<AnyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [campaign, setCampaign] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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

  async function updateField(id: string, column: string, value: string) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? ({ ...l, [column]: value } as AnyLead) : l)),
    );
    const supabase = createClient();
    const { error } = await supabase
      .from(table)
      .update({ [column]: value || null })
      .eq("id", id);
    if (error) {
      setError(`Failed to save ${column}: ${error.message}`);
    }
  }

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const kindByKey = useMemo(() => {
    const map: Record<string, ColumnKind> = {};
    for (const g of groups) for (const c of g.columns) map[c.key] = c.kind;
    return map;
  }, [groups]);

  function sortValue(lead: AnyLead, key: string): number | string | null {
    if (key === "pipeline_stage") {
      const stage = (lead.pipeline_stage as PipelineStage) ?? "Leads";
      return PIPELINE_STAGES.indexOf(stage);
    }
    const raw = (lead as unknown as Record<string, unknown>)[key];
    if (raw === null || raw === undefined || raw === "") return null;
    const kind = kindByKey[key];
    if (kind === "money" || kind === "number") {
      const n = typeof raw === "number" ? raw : parseFloat(String(raw));
      return Number.isNaN(n) ? null : n;
    }
    if (kind === "date") {
      const t = new Date(raw as string).getTime();
      return Number.isNaN(t) ? null : t;
    }
    return String(raw).toLowerCase();
  }

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sortKey, sortDir, kindByKey]);

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
        <button
          type="button"
          onClick={resetColumnOrder}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          title="Restore the default column order"
        >
          Reset columns
        </button>
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
                onClick={() => toggleSort("campaign")}
                className="sticky left-0 z-30 min-w-[90px] cursor-pointer select-none border-b border-r border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold text-slate-700 hover:bg-slate-200"
              >
                Campaign
                <SortIndicator active={sortKey === "campaign"} dir={sortDir} />
              </th>
              <th
                onClick={() => toggleSort("pipeline_stage")}
                className="sticky left-[90px] z-30 min-w-[160px] cursor-pointer select-none border-b border-r border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold text-slate-700 hover:bg-slate-200"
              >
                Pipeline Stage
                <SortIndicator active={sortKey === "pipeline_stage"} dir={sortDir} />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  draggable
                  onDragStart={() => setDragKey(col.key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragKey) moveColumn(dragKey, col.key);
                    setDragKey(null);
                  }}
                  onDragEnd={() => setDragKey(null)}
                  onClick={() => toggleSort(col.key)}
                  style={{ minWidth: col.width }}
                  className={`cursor-grab select-none border-b border-r border-slate-200 bg-slate-100 px-2 py-1 text-left font-medium text-slate-600 whitespace-nowrap hover:bg-slate-200 active:cursor-grabbing ${
                    dragKey === col.key ? "opacity-40" : ""
                  }`}
                  title="Drag to reorder, click to sort"
                >
                  <span className="mr-1 text-slate-300">⠿</span>
                  {col.header}
                  <SortIndicator active={sortKey === col.key} dir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((lead, i) => (
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
                {columns.map((col) => {
                    const value = (lead as unknown as Record<string, unknown>)[
                      col.key
                    ];
                    const isStatus = col.key === "outreach_status";
                    const statusClass =
                      isStatus && value
                        ? OUTREACH_STATUS_COLORS[value as string]
                        : "";
                    if (col.key === "notes" || col.key === "call_notes") {
                      return (
                        <td
                          key={String(col.key)}
                          className="border-b border-r border-slate-200 p-0"
                        >
                          <textarea
                            defaultValue={(value as string) ?? ""}
                            placeholder="Add a note…"
                            rows={1}
                            onBlur={(e) => {
                              const next = e.target.value;
                              if (next !== ((value as string) ?? "")) {
                                updateField(lead.id, col.key, next);
                              }
                            }}
                            className="block w-full min-w-[260px] resize-y border-0 bg-transparent px-2 py-1 text-xs focus:bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-300"
                          />
                        </td>
                      );
                    }
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
                  })}
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={2 + columns.length}
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
