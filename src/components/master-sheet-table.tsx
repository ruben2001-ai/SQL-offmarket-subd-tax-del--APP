"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Lead, PipelineStage } from "@/lib/types";
import { PIPELINE_STAGES, PIPELINE_STAGE_COLORS, OUTREACH_STATUS_COLORS } from "@/lib/types";
import {
  MASTER_SHEET_GROUPS,
  formatCell,
  telHref,
} from "@/lib/master-sheet-columns";

export default function MasterSheetTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
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
        .from("subdivide_outreach_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setLeads((data ?? []) as Lead[]);
        setError(null);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
      const haystack = [
        l.owner_first_name,
        l.owner_last_name,
        l.apn,
        l.parcel_address,
        l.city,
        l.phone_1,
        l.phone_2,
        l.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [leads, search, campaign, statusFilter]);

  async function updatePipelineStage(id: string, stage: PipelineStage) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, pipeline_stage: stage } : l)),
    );
    const supabase = createClient();
    const { error } = await supabase
      .from("subdivide_outreach_leads")
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
              {c === "All" ? "All counties" : c}
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
                County
              </th>
              <th
                rowSpan={2}
                className="sticky left-[90px] z-30 min-w-[160px] border-b border-r border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold text-slate-700"
              >
                Pipeline Stage
              </th>
              {MASTER_SHEET_GROUPS.map((group) => (
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
              {MASTER_SHEET_GROUPS.flatMap((group) =>
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
                {MASTER_SHEET_GROUPS.flatMap((group) =>
                  group.columns.map((col) => {
                    const value = lead[col.key];
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
                  colSpan={2 + MASTER_SHEET_GROUPS.flatMap((g) => g.columns).length}
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
