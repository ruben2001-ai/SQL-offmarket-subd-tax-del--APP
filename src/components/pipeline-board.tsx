"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AnyLead, DatasetId, PipelineStage } from "@/lib/types";
import { DATASETS, PIPELINE_STAGES, PIPELINE_STAGE_COLORS } from "@/lib/types";
import { useDataset } from "@/lib/dataset-context";
import {
  getLeadDisplay,
  getLatestMessage,
  getFunnelMilestones,
  getReachMethodBucket,
  wasOutreached,
  didRespond,
} from "@/lib/lead-adapter";
import type { ReachMethodBucket } from "@/lib/lead-adapter";
import { formatMoney, formatNumber, telHref, formatPhone } from "@/lib/format";
import StatTile from "@/components/stat-tile";
import CircleStat from "@/components/circle-stat";

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

    const outreachedCount = filtered.filter(wasOutreached).length;
    const respondedCount = filtered.filter(didRespond).length;
    const responseRate =
      outreachedCount > 0 ? (respondedCount / outreachedCount) * 100 : null;

    return {
      totalLeads,
      totalAcreage,
      totalValue,
      offeredCount: offered.length,
      offeredValue,
      acceptedCount: accepted.length,
      acceptedValue,
      winRate,
      outreachedCount,
      respondedCount,
      responseRate,
    };
  }, [filtered, byStage, dataset]);

  // Share of leads by reach channel (Text/Email/Manual) — Text is only ever
  // assigned to DNC-clear leads, so this doubles as the DNC picture without
  // a separate DNC stat. Independent shares of the same pool, not a funnel.
  const reachMethodStats = useMemo(() => {
    const total = filtered.length;
    const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);
    const counts: Record<ReachMethodBucket, number> = { Text: 0, Email: 0, Manual: 0 };
    for (const lead of filtered) {
      const bucket = getReachMethodBucket(lead);
      if (bucket) counts[bucket] += 1;
    }
    const colors: Record<ReachMethodBucket, string> = {
      Text: "var(--stage-outreached)",
      Email: "var(--stage-offered)",
      Manual: "var(--stage-dnc)",
    };
    return (["Text", "Email", "Manual"] as ReachMethodBucket[]).map((bucket) => ({
      key: bucket,
      label: bucket,
      color: colors[bucket],
      count: counts[bucket],
      percentOfTotal: pct(counts[bucket], total),
    }));
  }, [filtered]);

  // The pipeline mix funnel is a derived, cumulative view (outreached ->
  // responded -> qualified -> underwriting -> offered ->
  // accepted/rejected/long-term follow-up), independent of the discrete
  // pipeline_stage kanban columns below — see getFunnelMilestones for how
  // each bucket is inferred. Potential Leads is the complement of Outreached
  // (leads still left to contact), not the total pool, so it isn't a useful
  // "previous stage" denominator — Outreached's secondary percentage is
  // dropped rather than compared against it.
  const funnel = useMemo(() => {
    const total = filtered.length;
    const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);
    const milestones = filtered.map(getFunnelMilestones);
    const count = (pick: (m: (typeof milestones)[number]) => boolean) =>
      milestones.filter(pick).length;

    const outreachedCount = count((m) => m.outreached);
    const potentialLeadsCount = total - outreachedCount;
    const respondedCount = count((m) => m.responded);
    const qualifiedCount = count((m) => m.qualified);
    const notQualifiedCount = count((m) => m.notQualified);
    const underwritingCount = count((m) => m.underwriting);
    const offeredCount = count((m) => m.offered);
    const acceptedCount = count((m) => m.accepted);
    const rejectedCount = count((m) => m.rejected);
    const longTermFollowUpCount = count((m) => m.longTermFollowUp);

    return [
      {
        key: "potential",
        label: "Potential Leads",
        color: "var(--stage-potential)",
        count: potentialLeadsCount,
        percentOfTotal: pct(potentialLeadsCount, total),
        percentOfPrevious: null as number | null,
        previousLabel: null as string | null,
      },
      {
        key: "outreached",
        label: "Outreached",
        color: "var(--stage-outreached)",
        count: outreachedCount,
        percentOfTotal: pct(outreachedCount, total),
        percentOfPrevious: null,
        previousLabel: null,
      },
      {
        key: "responded",
        label: "Responded",
        color: "var(--stage-responded)",
        count: respondedCount,
        percentOfTotal: pct(respondedCount, total),
        percentOfPrevious: pct(respondedCount, outreachedCount),
        previousLabel: "Outreached",
      },
      {
        key: "qualified",
        label: "Qualified",
        color: "var(--stage-qualified)",
        count: qualifiedCount,
        percentOfTotal: pct(qualifiedCount, total),
        percentOfPrevious: pct(qualifiedCount, respondedCount),
        previousLabel: "Responded",
      },
      {
        key: "notQualified",
        label: "Not Qualified",
        color: "var(--stage-not-qualified)",
        count: notQualifiedCount,
        percentOfTotal: pct(notQualifiedCount, total),
        percentOfPrevious: pct(notQualifiedCount, respondedCount),
        previousLabel: "Responded",
      },
      {
        key: "underwriting",
        label: "Underwriting",
        color: "var(--stage-underwriting)",
        count: underwritingCount,
        percentOfTotal: pct(underwritingCount, total),
        percentOfPrevious: pct(underwritingCount, qualifiedCount),
        previousLabel: "Qualified",
      },
      {
        key: "offered",
        label: "Offered",
        color: "var(--stage-offered)",
        count: offeredCount,
        percentOfTotal: pct(offeredCount, total),
        percentOfPrevious: pct(offeredCount, underwritingCount),
        previousLabel: "Underwriting",
      },
      {
        key: "accepted",
        label: "Accepted",
        color: "var(--stage-accepted)",
        count: acceptedCount,
        percentOfTotal: pct(acceptedCount, total),
        percentOfPrevious: pct(acceptedCount, offeredCount),
        previousLabel: "Offered",
      },
      {
        key: "rejected",
        label: "Rejected",
        color: "var(--stage-rejected)",
        count: rejectedCount,
        percentOfTotal: pct(rejectedCount, total),
        percentOfPrevious: pct(rejectedCount, offeredCount),
        previousLabel: "Offered",
      },
      {
        key: "longTermFollowUp",
        label: "Long-term Follow-up",
        color: "var(--stage-longterm)",
        count: longTermFollowUpCount,
        percentOfTotal: pct(longTermFollowUpCount, total),
        percentOfPrevious: pct(longTermFollowUpCount, offeredCount),
        previousLabel: "Offered",
      },
    ];
  }, [filtered]);

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <StatTile
          label="Response rate"
          value={kpis.responseRate === null ? "—" : `${kpis.responseRate.toFixed(0)}%`}
          sublabel={`${formatNumber(kpis.respondedCount)} of ${formatNumber(kpis.outreachedCount)} outreached`}
        />
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

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-slate-800">
          Pipeline Mix — % of {formatNumber(filtered.length)} leads
        </div>
        <div className="flex items-start gap-5 overflow-x-auto pb-1">
          {reachMethodStats.map((stat) => (
            <CircleStat
              key={stat.key}
              percent={stat.percentOfTotal}
              color={stat.color}
              label={stat.label}
              sublabel={`${formatNumber(stat.count)} leads`}
            />
          ))}
          <div className="mt-8 h-16 w-px shrink-0 bg-slate-200" aria-hidden />
          {funnel.map((step) => (
            <CircleStat
              key={step.key}
              percent={step.percentOfTotal}
              color={step.color}
              label={step.label}
              sublabel={`${formatNumber(step.count)} leads`}
              secondary={
                step.percentOfPrevious === null || step.previousLabel === null
                  ? undefined
                  : `${Math.round(step.percentOfPrevious)}% of ${step.previousLabel}`
              }
            />
          ))}
        </div>
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
  const { ownerName, acreage, address, value, valuePerAcre } = getLeadDisplay(lead, dataset);
  const latestMessage = getLatestMessage(lead, dataset);
  const price = lead.counter_amount || lead.offer_amount
    ? lead.counter_amount || formatMoney(lead.offer_amount)
    : null;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-medium leading-tight text-slate-900">
          {ownerName}
        </span>
        {lead.campaign && (
          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            {lead.campaign}
          </span>
        )}
      </div>

      <div className="mt-0.5 text-[11px] leading-tight text-slate-500">
        {acreage ? `${formatNumber(acreage)} ac` : null}
        {address ? ` · ${address}` : null}
      </div>

      {(value || valuePerAcre) && (
        <div className="mt-0.5 text-[11px] leading-tight text-slate-600">
          {value ? formatMoney(value) : null}
          {value && valuePerAcre ? " · " : null}
          {valuePerAcre ? `${formatMoney(valuePerAcre)}/ac` : null}
        </div>
      )}

      {lead.apn && (
        <div className="mt-0.5 text-[10px] text-slate-400">APN {lead.apn}</div>
      )}

      {price && (
        <div className="mt-0.5 text-[11px] font-medium text-slate-700">
          Offer: {price}
        </div>
      )}

      {latestMessage && (
        <div className="mt-1 line-clamp-2 rounded bg-slate-50 px-1.5 py-1 text-[10px] italic leading-snug text-slate-500">
          &ldquo;{latestMessage}&rdquo;
        </div>
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
        className="mt-1.5 w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] text-slate-600"
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
