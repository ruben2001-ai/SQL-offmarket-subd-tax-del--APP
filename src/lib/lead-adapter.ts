import type { AnyLead, DatasetId } from "@/lib/types";

// The two lead tables name their equivalent owner/acreage/value/address
// fields differently. This normalizes just the handful of fields the
// pipeline board's KPIs and cards need, without forcing a shared schema.
export type LeadDisplay = {
  ownerName: string;
  acreage: number | null;
  value: number | null;
  address: string | null;
};

export function getLeadDisplay(lead: AnyLead, dataset: DatasetId): LeadDisplay {
  const row = lead as unknown as Record<string, unknown>;

  if (dataset === "tax_delinquent") {
    const owner1 = row.owner_1_full_name as string | null;
    const owner2 = row.owner_2_full_name as string | null;
    return {
      ownerName: [owner1, owner2].filter(Boolean).join(" & ") || "Unknown owner",
      acreage: (row.total_acreage_owner as number | null) ?? (row.lot_acres as number | null) ?? null,
      value: (row.total_market_value as number | null) ?? null,
      address: (row.parcel_full_address as string | null) ?? (row.mail_full_address as string | null) ?? null,
    };
  }

  const first = row.owner_first_name as string | null;
  const last = row.owner_last_name as string | null;
  return {
    ownerName: [first, last].filter(Boolean).join(" ") || "Unknown owner",
    acreage: (row.acreage as number | null) ?? null,
    value: (row.market_value_estimate as number | null) ?? null,
    address: (row.parcel_address as string | null) ?? null,
  };
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
