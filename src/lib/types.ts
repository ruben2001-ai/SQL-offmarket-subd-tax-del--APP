export type DatasetId = "subdivide" | "tax_delinquent";

export const DATASETS: Record<
  DatasetId,
  { label: string; table: string; shortLabel: string }
> = {
  subdivide: {
    label: "Off-Market Subdivide",
    shortLabel: "Subdivide",
    table: "subdivide_outreach_leads",
  },
  tax_delinquent: {
    label: "NC Tax Delinquent",
    shortLabel: "Tax Delinquent",
    table: "tax_delinquent_leads",
  },
};

export type Lead = {
  id: string;
  campaign: string | null;

  reach_method: string | null;
  dnc_status: string | null;
  facebook: string | null;
  linkedin: string | null;
  parcel_link: string | null;

  apn: string | null;
  acreage: number | null;
  market_value_estimate: number | null;
  mkt_value_per_acre_estimate: number | null;
  road_frontage_ft: number | null;

  sub_lots: number | null;
  avg_lot_acres: number | null;
  total_acreage: number | null;
  parcel_count: number | null;

  parcel_address: string | null;
  city: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;

  owner_first_name: string | null;
  owner_last_name: string | null;
  email: string | null;

  phone_1: string | null;
  phone_2: string | null;
  phone_3: string | null;
  phone_4: string | null;
  phone_5: string | null;
  phone_6: string | null;
  phone_1_type: string | null;
  phone_2_type: string | null;
  phone_3_type: string | null;

  dnc: string | null;
  state_dnc: string | null;
  tag_subdivide: string | null;
  last_sale_date: string | null;
  last_sale_price: number | null;

  active_phone: string | null;
  active_phone_index: number | null;

  quo_message_sent: string | null;
  quo_message_date: string | null;
  quo_response_category: string | null;
  response_date: string | null;
  response_type: string | null;

  follow_up_1_date: string | null;
  follow_up_2_date: string | null;
  follow_up_3_date: string | null;

  outreach_status: string | null;
  contact_quality: string | null;
  skip_reason: string | null;

  offer_made: string | null;
  offer_amount: number | null;
  offer_status: string | null;
  counter_amount: string | null;

  call_completed: string | null;
  call_date: string | null;
  call_notes: string | null;
  notes: string | null;

  pipeline_stage: PipelineStage | null;
  created_at: string | null;
};

export type TaxDelinquentLead = {
  id: string;
  campaign: string | null;
  source_sheet: string | null;

  reach_method: string | null;
  dnc_status: string | null;
  deceased: string | null;
  facebook: string | null;
  linkedin: string | null;

  apn: string | null;
  property_id: number | null;
  lot_acres: number | null;
  total_acreage_owner: number | null;
  parcel_count_owner: number | null;
  primary_parcel: string | null;
  sub_lots: number | null;
  avg_lot_acres: number | null;

  owner_1_full_name: string | null;
  owner_2_full_name: string | null;
  owner_1_first_name: string | null;
  owner_1_last_name: string | null;

  mail_full_address: string | null;
  mail_city: string | null;
  mail_state: string | null;
  mail_zip: string | null;

  parcel_full_address: string | null;
  parcel_city: string | null;
  parcel_state: string | null;
  parcel_county: string | null;
  parcel_zip: string | null;

  land_use: string | null;
  road_frontage: number | null;
  total_market_value: number | null;
  total_assessed_value: number | null;
  tax_amt: number | null;
  tax_delinquent_year: number | null;
  zoning: string | null;
  subdivision_name: string | null;
  age: string | null;

  land_locked: string | null;
  latitude: number | null;
  longitude: number | null;
  parcel_link: string | null;

  active_phone: string | null;
  active_phone_index: number | null;
  email_1: string | null;
  email_2: string | null;

  phone_1: string | null;
  phone_1_type: string | null;
  phone_2: string | null;
  phone_2_type: string | null;
  phone_3: string | null;
  phone_3_type: string | null;
  phone_4: string | null;
  phone_4_type: string | null;
  phone_5: string | null;
  phone_5_type: string | null;
  phone_6: string | null;
  phone_6_type: string | null;
  phone_7: string | null;
  phone_7_type: string | null;

  skip_reason: string | null;
  quo_message_sent: string | null;
  quo_message: string | null;
  quo_response: string | null;
  response_date: string | null;
  response_type: string | null;
  follow_up_1_date: string | null;
  follow_up_2_date: string | null;

  outreach_status: string | null;
  contact_quality: string | null;
  notes: string | null;

  offer_made: string | null;
  offer_amount: number | null;
  offer_status: string | null;
  counter_amount: string | null;

  call_completed: string | null;
  call_date: string | null;
  call_notes: string | null;

  pipeline_stage: PipelineStage | null;
  raw: Record<string, unknown> | null;
  created_at: string | null;
};

export type AnyLead = Lead | TaxDelinquentLead;

export const PIPELINE_STAGES = [
  "DNC",
  "Leads",
  "Outreached",
  "Underwriting",
  "Offered",
  "Follow-up",
  "Accepted",
  "Rejected",
  "Long-term Follow-up",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

// Validated 9-slot categorical palette (dataviz skill default order extended
// with a red DNC slot up front — resolved via CSS vars in globals.css so
// light/dark both stay within the validated adjacent-pair CVD gates). Color
// is always paired with the stage's text label, never used alone to carry
// meaning.
export const PIPELINE_STAGE_COLORS: Record<PipelineStage, string> = {
  DNC: "var(--stage-dnc)",
  Leads: "var(--stage-leads)",
  Outreached: "var(--stage-outreached)",
  Underwriting: "var(--stage-underwriting)",
  Offered: "var(--stage-offered)",
  "Follow-up": "var(--stage-followup)",
  Accepted: "var(--stage-accepted)",
  Rejected: "var(--stage-rejected)",
  "Long-term Follow-up": "var(--stage-longterm)",
};

export const OUTREACH_STATUS_COLORS: Record<string, string> = {
  Messaged: "bg-sky-100 text-sky-800",
  Responded: "bg-cyan-100 text-cyan-800",
  "Intro Sent": "bg-blue-100 text-blue-800",
  "Price Asked": "bg-violet-100 text-violet-800",
  "Call Time Asked": "bg-purple-100 text-purple-800",
  "Qualified - Call Booked": "bg-emerald-100 text-emerald-800",
  "Closed - No": "bg-rose-100 text-rose-800",
  "Sequence Complete": "bg-slate-200 text-slate-700",
  "Retry Next Phone": "bg-amber-100 text-amber-800",
  "Already Contacted": "bg-slate-100 text-slate-600",
  "Contact Missing": "bg-red-100 text-red-800",
  "Do Not Contact": "bg-black text-white",
  "Quo Error": "bg-red-200 text-red-900",
};
