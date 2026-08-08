import type { Lead } from "@/lib/types";
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatPhone,
  telHref,
} from "@/lib/format";

export type ColumnKind =
  | "text"
  | "money"
  | "number"
  | "date"
  | "phone"
  | "link"
  | "email";

export type Column = {
  key: keyof Lead;
  header: string;
  kind: ColumnKind;
  width: number;
};

export type ColumnGroup = {
  label: string;
  columns: Column[];
};

// Mirrors the "All Reachable Leads" master sheet layout, section by section,
// left to right, exactly as laid out in the outreach CLAUDE.md.
export const MASTER_SHEET_GROUPS: ColumnGroup[] = [
  {
    label: "Reach",
    columns: [
      { key: "reach_method", header: "Reach Method", kind: "text", width: 110 },
      { key: "dnc_status", header: "DNC Status", kind: "text", width: 100 },
      { key: "facebook", header: "Facebook", kind: "link", width: 90 },
      { key: "linkedin", header: "LinkedIn", kind: "link", width: 90 },
      { key: "parcel_link", header: "Parcel Link", kind: "link", width: 90 },
    ],
  },
  {
    label: "Parcel",
    columns: [
      { key: "apn", header: "APN", kind: "text", width: 130 },
      { key: "acreage", header: "Acreage", kind: "number", width: 90 },
      {
        key: "market_value_estimate",
        header: "Market Value Est.",
        kind: "money",
        width: 130,
      },
      {
        key: "mkt_value_per_acre_estimate",
        header: "Mkt Value/Acre Est.",
        kind: "money",
        width: 130,
      },
      {
        key: "road_frontage_ft",
        header: "Road Frontage FT",
        kind: "number",
        width: 110,
      },
    ],
  },
  {
    label: "Subdivision",
    columns: [
      { key: "sub_lots", header: "Sub Lots", kind: "number", width: 90 },
      { key: "avg_lot_acres", header: "Avg Lot Acres", kind: "number", width: 100 },
      { key: "total_acreage", header: "Total Acreage", kind: "number", width: 100 },
      { key: "parcel_count", header: "Parcel Count", kind: "number", width: 100 },
    ],
  },
  {
    label: "Address",
    columns: [
      { key: "parcel_address", header: "Parcel Address", kind: "text", width: 200 },
      { key: "city", header: "City", kind: "text", width: 110 },
      { key: "zip", header: "ZIP", kind: "text", width: 80 },
      { key: "latitude", header: "Latitude", kind: "number", width: 90 },
      { key: "longitude", header: "Longitude", kind: "number", width: 90 },
    ],
  },
  {
    label: "Owner",
    columns: [
      { key: "owner_first_name", header: "Owner 1 First Name", kind: "text", width: 130 },
      { key: "owner_last_name", header: "Owner 1 Last Name", kind: "text", width: 130 },
      { key: "email", header: "Email", kind: "email", width: 180 },
    ],
  },
  {
    label: "Phones",
    columns: [
      { key: "phone_1", header: "Phone 1", kind: "phone", width: 130 },
      { key: "phone_2", header: "Phone 2", kind: "phone", width: 130 },
      { key: "phone_3", header: "Phone 3", kind: "phone", width: 130 },
      { key: "phone_4", header: "Phone 4", kind: "phone", width: 130 },
      { key: "phone_5", header: "Phone 5", kind: "phone", width: 130 },
      { key: "phone_6", header: "Phone 6", kind: "phone", width: 130 },
    ],
  },
  {
    label: "Phone Types",
    columns: [
      { key: "phone_1_type", header: "Phone 1 Type", kind: "text", width: 100 },
      { key: "phone_2_type", header: "Phone 2 Type", kind: "text", width: 100 },
      { key: "phone_3_type", header: "Phone 3 Type", kind: "text", width: 100 },
    ],
  },
  {
    label: "Compliance",
    columns: [
      { key: "dnc", header: "DNC", kind: "text", width: 70 },
      { key: "state_dnc", header: "State DNC", kind: "text", width: 90 },
      { key: "tag_subdivide", header: "Tag:Subdivide", kind: "text", width: 110 },
      { key: "last_sale_date", header: "Last Sale Date", kind: "date", width: 120 },
      { key: "last_sale_price", header: "Last Sale Price", kind: "money", width: 120 },
    ],
  },
  {
    label: "Active",
    columns: [
      { key: "active_phone", header: "Active Phone", kind: "phone", width: 130 },
      {
        key: "active_phone_index",
        header: "Active Phone Index",
        kind: "number",
        width: 110,
      },
    ],
  },
  {
    label: "Quo",
    columns: [
      { key: "quo_message_sent", header: "Quo Message Sent", kind: "text", width: 260 },
      { key: "quo_message_date", header: "Quo Message Date", kind: "date", width: 130 },
      {
        key: "quo_response_category",
        header: "Quo Response Category",
        kind: "text",
        width: 140,
      },
      { key: "response_date", header: "Response Date", kind: "date", width: 120 },
      { key: "response_type", header: "Response Type", kind: "text", width: 130 },
    ],
  },
  {
    label: "Follow-ups",
    columns: [
      { key: "follow_up_1_date", header: "Follow Up 1 Date", kind: "date", width: 120 },
      { key: "follow_up_2_date", header: "Follow Up 2 Date", kind: "date", width: 120 },
      { key: "follow_up_3_date", header: "Follow Up 3 Date", kind: "date", width: 120 },
    ],
  },
  {
    label: "Status",
    columns: [
      { key: "outreach_status", header: "Outreach Status", kind: "text", width: 150 },
      { key: "contact_quality", header: "Contact Quality", kind: "text", width: 110 },
      { key: "skip_reason", header: "Skip Reason", kind: "text", width: 160 },
    ],
  },
  {
    label: "Offer",
    columns: [
      { key: "offer_made", header: "Offer Made", kind: "text", width: 90 },
      { key: "offer_amount", header: "Offer Amount", kind: "money", width: 120 },
      { key: "offer_status", header: "Offer Status", kind: "text", width: 110 },
      { key: "counter_amount", header: "Counter Amount", kind: "text", width: 130 },
    ],
  },
  {
    label: "Call",
    columns: [
      { key: "call_completed", header: "Call Completed", kind: "text", width: 110 },
      { key: "call_date", header: "Call Date", kind: "text", width: 140 },
      { key: "call_notes", header: "Call Notes", kind: "text", width: 220 },
      { key: "notes", header: "Notes", kind: "text", width: 320 },
    ],
  },
];

export function formatCell(kind: ColumnKind, value: unknown) {
  switch (kind) {
    case "money":
      return formatMoney(value as number | null);
    case "number":
      return formatNumber(value as number | null);
    case "date":
      return formatDate(value as string | null);
    case "phone":
      return formatPhone(value as string | null);
    default:
      return (value as string | null) ?? "";
  }
}

export { telHref };
