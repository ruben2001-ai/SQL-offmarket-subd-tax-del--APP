"use client";

import { DATASETS, type DatasetId } from "@/lib/types";
import { useDataset } from "@/lib/dataset-context";

export default function DatasetSwitcher() {
  const { dataset, setDataset } = useDataset();

  return (
    <select
      value={dataset}
      onChange={(e) => setDataset(e.target.value as DatasetId)}
      className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-700"
    >
      {(Object.keys(DATASETS) as DatasetId[]).map((id) => (
        <option key={id} value={id}>
          {DATASETS[id].label}
        </option>
      ))}
    </select>
  );
}
