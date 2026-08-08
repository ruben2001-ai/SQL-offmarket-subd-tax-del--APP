import type { DatasetId } from "@/lib/types";
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
  key: string;
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
export const SUBDIVIDE_COLUMN_GROUPS: ColumnGroup[] = [
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

// Mirrors the tax_delinquent_leads table, section by section.
export const TAX_DELINQUENT_COLUMN_GROUPS: ColumnGroup[] = [
  {
    label: "Reach",
    columns: [
      { key: "reach_method", header: "Reach Method", kind: "text", width: 110 },
      { key: "dnc_status", header: "DNC Status", kind: "text", width: 100 },
      { key: "deceased", header: "Deceased", kind: "text", width: 80 },
      { key: "facebook", header: "Facebook", kind: "link", width: 90 },
      { key: "linkedin", header: "LinkedIn", kind: "link", width: 90 },
      { key: "parcel_link", header: "Parcel Link", kind: "link", width: 90 },
    ],
  },
  {
    label: "Parcel",
    columns: [
      { key: "apn", header: "APN", kind: "text", width: 130 },
      { key: "property_id", header: "Property ID", kind: "text", width: 100 },
      { key: "lot_acres", header: "Lot Acres", kind: "number", width: 90 },
      { key: "total_acreage_owner", header: "Total Acreage (Owner)", kind: "number", width: 130 },
      { key: "parcel_count_owner", header: "Parcel Count (Owner)", kind: "number", width: 120 },
      { key: "sub_lots", header: "Sub Lots", kind: "number", width: 90 },
      { key: "avg_lot_acres", header: "Avg Lot Acres", kind: "number", width: 100 },
      { key: "land_use", header: "Land Use", kind: "text", width: 180 },
      { key: "zoning", header: "Zoning", kind: "text", width: 90 },
      { key: "subdivision_name", header: "Subdivision", kind: "text", width: 160 },
      { key: "land_locked", header: "Land Locked", kind: "text", width: 90 },
      { key: "road_frontage", header: "Road Frontage", kind: "number", width: 110 },
    ],
  },
  {
    label: "Tax / Value",
    columns: [
      { key: "total_market_value", header: "Market Value", kind: "money", width: 120 },
      { key: "total_assessed_value", header: "Assessed Value", kind: "money", width: 120 },
      { key: "tax_amt", header: "Tax Amt", kind: "money", width: 90 },
      { key: "tax_delinquent_year", header: "Delinquent Year", kind: "number", width: 100 },
    ],
  },
  {
    label: "Mailing Address",
    columns: [
      { key: "mail_full_address", header: "Mail Address", kind: "text", width: 180 },
      { key: "mail_city", header: "Mail City", kind: "text", width: 110 },
      { key: "mail_state", header: "Mail State", kind: "text", width: 70 },
      { key: "mail_zip", header: "Mail Zip", kind: "text", width: 80 },
    ],
  },
  {
    label: "Parcel Address",
    columns: [
      { key: "parcel_full_address", header: "Parcel Address", kind: "text", width: 180 },
      { key: "parcel_city", header: "Parcel City", kind: "text", width: 110 },
      { key: "parcel_state", header: "Parcel State", kind: "text", width: 70 },
      { key: "parcel_county", header: "County", kind: "text", width: 110 },
      { key: "parcel_zip", header: "Parcel Zip", kind: "text", width: 80 },
      { key: "latitude", header: "Latitude", kind: "number", width: 90 },
      { key: "longitude", header: "Longitude", kind: "number", width: 90 },
    ],
  },
  {
    label: "Owner",
    columns: [
      { key: "owner_1_full_name", header: "Owner 1", kind: "text", width: 160 },
      { key: "owner_2_full_name", header: "Owner 2", kind: "text", width: 160 },
      { key: "age", header: "Age", kind: "text", width: 60 },
      { key: "email_1", header: "Email 1", kind: "email", width: 180 },
      { key: "email_2", header: "Email 2", kind: "email", width: 180 },
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
      { key: "phone_7", header: "Phone 7", kind: "phone", width: 130 },
    ],
  },
  {
    label: "Active",
    columns: [
      { key: "active_phone", header: "Active Phone", kind: "phone", width: 130 },
      { key: "active_phone_index", header: "Active Phone Index", kind: "number", width: 110 },
    ],
  },
  {
    label: "Quo",
    columns: [
      { key: "quo_message_sent", header: "Quo Message Sent", kind: "text", width: 260 },
      { key: "quo_message", header: "Quo Message", kind: "text", width: 260 },
      { key: "quo_response", header: "Quo Response", kind: "text", width: 200 },
      { key: "response_date", header: "Response Date", kind: "date", width: 120 },
      { key: "response_type", header: "Response Type", kind: "text", width: 130 },
    ],
  },
  {
    label: "Follow-ups",
    columns: [
      { key: "follow_up_1_date", header: "Follow Up 1 Date", kind: "date", width: 120 },
      { key: "follow_up_2_date", header: "Follow Up 2 Date", kind: "date", width: 120 },
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

export const COLUMN_GROUPS_BY_DATASET: Record<DatasetId, ColumnGroup[]> = {
  subdivide: SUBDIVIDE_COLUMN_GROUPS,
  tax_delinquent: TAX_DELINQUENT_COLUMN_GROUPS,
};

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
