"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AnyLead, DatasetId, PipelineStage } from "@/lib/types";
import { DATASETS, PIPELINE_STAGES, PIPELINE_STAGE_COLORS } from "@/lib/types";
import { useDataset } from "@/lib/dataset-context";
import { getLeadDisplay } from "@/lib/lead-adapter";
import { formatMoney, formatNumber, telHref, formatPhone } from "@/lib/format";
import StatTile from "@/components/stat-tile";

export default function PipelineBoard() {
  const { dataset } = useDataset();
  const table = DATASETS[dataset].table;

  // Remounting on `table` change (rather than resetting filter state inside
  // an effect) gives every dataset switch a clean slate for free.
  return <PipelineBoardInner key={table} dataset={dataset} table={table} />;
}

function PipelineBoardInner({
  dataset,
  table,
}: {
  dataset: DatasetId;
  table: string;
}) {
  const [leads, setLeads] = useState<AnyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<string>("All");

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
      if (error) setError(error.message);
      else {
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

  const filtered = useMemo(
    () => leads.filter((l) => campaign === "All" || l.campaign === campaign),
    [leads, campaign],
  );

  const byStage = useMemo(() => {
    const map = new Map<PipelineStage, AnyLead[]>();
    for (const stage of PIPELINE_STAGES) map.set(stage, []);
    for (const lead of filtered) {
      const stage = (lead.pipeline_stage as PipelineStage) ?? "Leads";
      map.get(stage)?.push(lead);
    }
    return map;
  }, [filtered]);

  const kpis = useMemo(() => {
    const totalLeads = filtered.length;
    const totalAcreage = filtered.reduce(
      (s, l) => s + (getLeadDisplay(l, dataset).acreage ?? 0),
      0,
    );
    const totalValue = filtered.reduce(
      (s, l) => s + (getLeadDisplay(l, dataset).value ?? 0),
      0,
    );
    const offered = byStage.get("Offered") ?? [];
    const accepted = byStage.get("Accepted") ?? [];
    const rejected = byStage.get("Rejected") ?? [];
    const offeredValue = offered.reduce((s, l) => s + (l.offer_amount ?? 0), 0);
    const acceptedValue = accepted.reduce(
      (s, l) => s + (l.offer_amount ?? 0),
      0,
    );
    const decided = accepted.length + rejected.length;
    const winRate = decided > 0 ? (accepted.length / decided) * 100 : null;

    return {
      totalLeads,
      totalAcreage,
      totalValue,
      offeredCount: offered.length,
      offeredValue,
      acceptedCount: accepted.length,
      acceptedValue,
      winRate,
    };
  }, [filtered, byStage, dataset]);

  async function updatePipelineStage(id: string, stage: PipelineStage) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, pipeline_stage: stage } : l)),
    );
    const supabase = createClient();
    const { error } = await supabase
      .from(table)
      .update({ pipeline_stage: stage })
      .eq("id", id);
    if (error) setError(`Failed to save pipeline stage: ${error.message}`);
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          Sales Pipeline Overview
        </h1>
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
        <span className="ml-auto text-sm text-slate-500">
          {loading ? "Loading…" : `${filtered.length} leads`}
        </span>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total leads" value={formatNumber(kpis.totalLeads)} />
        <StatTile
          label="Total acreage"
          value={formatNumber(Math.round(kpis.totalAcreage))}
          sublabel="acres"
        />
        <StatTile
          label="Est. portfolio value"
          value={formatMoney(kpis.totalValue)}
        />
        <StatTile
          label="Offers out"
          value={String(kpis.offeredCount)}
          sublabel={formatMoney(kpis.offeredValue)}
        />
        <StatTile
          label="Accepted"
          value={String(kpis.acceptedCount)}
          sublabel={formatMoney(kpis.acceptedValue)}
        />
        <StatTile
          label="Win rate"
          value={kpis.winRate === null ? "—" : `${kpis.winRate.toFixed(0)}%`}
          sublabel="accepted vs. rejected"
        />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = byStage.get(stage) ?? [];
          const stageValue = stageLeads.reduce(
            (s, l) => s + (getLeadDisplay(l, dataset).value ?? 0),
            0,
          );
          return (
            <div
              key={stage}
              className="flex w-72 shrink-0 flex-col rounded-lg border border-slate-200 bg-slate-100"
            >
              <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: PIPELINE_STAGE_COLORS[stage] }}
                  aria-hidden
                />
                <span className="text-sm font-semibold text-slate-800">
                  {stage}
                </span>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                  {stageLeads.length}
                </span>
              </div>
              <div className="px-3 py-1.5 text-xs text-slate-500">
                {formatMoney(stageValue)} est. value
              </div>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2" style={{ maxHeight: "calc(100vh - 340px)" }}>
                {stageLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    dataset={dataset}
                    onStageChange={(s) => updatePipelineStage(lead.id, s)}
                  />
                ))}
                {stageLeads.length === 0 && (
                  <div className="px-2 py-6 text-center text-xs text-slate-400">
                    No leads
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  dataset,
  onStageChange,
}: {
  lead: AnyLead;
  dataset: DatasetId;
  onStageChange: (stage: PipelineStage) => void;
}) {
  const { ownerName, acreage, address } = getLeadDisplay(lead, dataset);
  const price = lead.counter_amount || lead.offer_amount
    ? lead.counter_amount || formatMoney(lead.offer_amount)
    : null;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-slate-900">{ownerName}</span>
        {lead.campaign && (
          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            {lead.campaign}
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {acreage ? `${formatNumber(acreage)} ac` : null}
        {address ? ` · ${address}` : null}
      </div>
      {lead.apn && (
        <div className="mt-0.5 text-[11px] text-slate-400">APN {lead.apn}</div>
      )}
      {price && (
        <div className="mt-1 text-xs font-medium text-slate-700">{price}</div>
      )}
      <div className="mt-1 flex items-center gap-2">
        {lead.active_phone || lead.phone_1 ? (
          <a
            href={telHref(lead.active_phone || lead.phone_1)}
            className="text-[11px] text-sky-600 hover:underline"
          >
            {formatPhone(lead.active_phone || lead.phone_1)}
          </a>
        ) : null}
        {lead.parcel_link && (
          <a
            href={lead.parcel_link}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-sky-600 hover:underline"
          >
            Parcel
          </a>
        )}
      </div>
      <select
        value={lead.pipeline_stage ?? "Leads"}
        onChange={(e) => onStageChange(e.target.value as PipelineStage)}
        className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] text-slate-600"
      >
        {PIPELINE_STAGES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
