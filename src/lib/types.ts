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

export const PIPELINE_STAGES = [
  "Leads",
  "Underwritten",
  "Outreached",
  "Offered",
  "Follow-up",
  "Accepted",
  "Rejected",
  "Long-term Follow-up",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

// Validated 8-slot categorical palette (dataviz skill default order: blue, orange,
// aqua, yellow, magenta, green, violet, red — resolved via CSS vars in globals.css
// so light/dark both stay within the validated adjacent-pair CVD gates). Color is
// always paired with the stage's text label, never used alone to carry meaning.
export const PIPELINE_STAGE_COLORS: Record<PipelineStage, string> = {
  Leads: "var(--stage-leads)",
  Underwritten: "var(--stage-underwritten)",
  Outreached: "var(--stage-outreached)",
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
