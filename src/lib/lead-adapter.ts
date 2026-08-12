import type { AnyLead, DatasetId } from "@/lib/types";

// The two lead tables name their equivalent owner/acreage/value/address
// fields differently. This normalizes just the handful of fields the
// pipeline board's KPIs and cards need, without forcing a shared schema.
export type LeadDisplay = {
  ownerName: string;
  acreage: number | null;
  value: number | null;
  valuePerAcre: number | null;
  address: string | null;
};

export function getLeadDisplay(lead: AnyLead, dataset: DatasetId): LeadDisplay {
  const row = lead as unknown as Record<string, unknown>;

  if (dataset === "tax_delinquent") {
    const owner1 = row.owner_1_full_name as string | null;
    const owner2 = row.owner_2_full_name as string | null;
    const acreage = (row.total_acreage_owner as number | null) ?? (row.lot_acres as number | null) ?? null;
    const value = (row.total_market_value as number | null) ?? null;
    return {
      ownerName: [owner1, owner2].filter(Boolean).join(" & ") || "Unknown owner",
      acreage,
      value,
      valuePerAcre: value && acreage ? value / acreage : null,
      address: (row.parcel_full_address as string | null) ?? (row.mail_full_address as string | null) ?? null,
    };
  }

  const first = row.owner_first_name as string | null;
  const last = row.owner_last_name as string | null;
  return {
    ownerName: [first, last].filter(Boolean).join(" ") || "Unknown owner",
    acreage: (row.acreage as number | null) ?? null,
    value: (row.market_value_estimate as number | null) ?? null,
    valuePerAcre: (row.mkt_value_per_acre_estimate as number | null) ?? null,
    address: (row.parcel_address as string | null) ?? null,
  };
}

// Most recent Quo message text for the card view. Subdivide only stores the
// outbound text (`quo_message_sent`); tax delinquent also stores the raw
// inbound reply (`quo_response`), which is the more useful "latest" line
// when both exist.
export function getLatestMessage(lead: AnyLead, dataset: DatasetId): string | null {
  const row = lead as unknown as Record<string, unknown>;
  if (dataset === "tax_delinquent") {
    return (
      (row.quo_response as string | null) ||
      (row.quo_message as string | null) ||
      (row.quo_message_sent as string | null) ||
      null
    );
  }
  return (row.quo_message_sent as string | null) || null;
}

// A lead counts as "outreached" once a message has actually gone out —
// either `quo_message_sent` holds the sent text, or `outreach_status` has
// moved past the untouched "Not Contacted" default. Field names match across
// both tables, so no per-dataset branching is needed.
export function wasOutreached(lead: AnyLead): boolean {
  const row = lead as unknown as Record<string, unknown>;
  const status = row.outreach_status as string | null;
  return Boolean(row.quo_message_sent) || Boolean(status && status !== "Not Contacted");
}

// `response_date` is set whenever a reply was logged, regardless of dataset.
export function didRespond(lead: AnyLead): boolean {
  const row = lead as unknown as Record<string, unknown>;
  return Boolean(row.response_date);
}

// DNC screening status is separate from the real `DNC` pipeline_stage — a
// lead can be un-screened or flagged in the DNC/state_dnc columns without
// anyone having manually moved it into the DNC stage yet. Subdivide tracks
// federal (`dnc`) and state (`state_dnc`) scrub results as separate Yes/No
// flags; tax delinquent collapses both into one `dnc_status` (Clear / DNC /
// Litigator / No Data). This returns true unless both show an explicit,
// confirmed "clear" result — i.e. it also catches leads nobody has screened
// yet, not just ones already flagged.
export function isDncStatusUnclear(lead: AnyLead, dataset: DatasetId): boolean {
  const row = lead as unknown as Record<string, unknown>;
  if (dataset === "tax_delinquent") {
    return (row.dnc_status as string | null) !== "Clear";
  }
  return !(row.dnc === "No" && row.state_dnc === "No");
}

// Derived, cumulative funnel position — independent of the discrete
// `pipeline_stage` kanban column (and of the real `DNC` stage, which is a
// manual compliance placement, not a funnel step). Each flag implies every
// flag before it in the chain (outreached -> responded -> qualified ->
// underwriting -> offered -> accepted/rejected), inferred from the
// strongest available signal (pipeline_stage, outreach_status,
// response_date), so a lead that jumped straight to "Offered" still counts
// in every earlier bucket even if the intermediate status fields were never
// filled in by hand. Reuses `wasOutreached`/`didRespond` so this stays
// consistent with the Response rate KPI.
export type FunnelMilestones = {
  outreached: boolean;
  responded: boolean;
  qualified: boolean;
  notQualified: boolean;
  underwriting: boolean;
  offered: boolean;
  accepted: boolean;
  rejected: boolean;
};

const RESPONDED_STATUSES = new Set([
  "Responded",
  "Intro Sent",
  "Price Asked",
  "Call Time Asked",
  "Qualified - Call Booked",
  "Closed - No",
]);

export function getFunnelMilestones(lead: AnyLead): FunnelMilestones {
  const row = lead as unknown as Record<string, unknown>;
  const status = (row.outreach_status as string | null) ?? null;
  const stage = lead.pipeline_stage;

  const accepted = stage === "Accepted";
  const rejected = stage === "Rejected";
  const offered =
    accepted ||
    rejected ||
    stage === "Offered" ||
    stage === "Follow-up" ||
    stage === "Long-term Follow-up";
  const underwriting = offered || stage === "Underwriting";
  const qualified = underwriting || status === "Qualified - Call Booked";
  const notQualified = !qualified && status === "Closed - No";
  const responded =
    qualified ||
    notQualified ||
    didRespond(lead) ||
    (status !== null && RESPONDED_STATUSES.has(status));
  const outreached = responded || wasOutreached(lead) || stage === "Outreached";

  return {
    outreached,
    responded,
    qualified,
    notQualified,
    underwriting,
    offered,
    accepted,
    rejected,
  };
}
