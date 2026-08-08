"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { DatasetId } from "@/lib/types";

const STORAGE_KEY = "dataset";
const DEFAULT_DATASET: DatasetId = "subdivide";

type DatasetContextValue = {
  dataset: DatasetId;
  setDataset: (dataset: DatasetId) => void;
};

const DatasetContext = createContext<DatasetContextValue | null>(null);

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): DatasetId {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "subdivide" || stored === "tax_delinquent"
    ? stored
    : DEFAULT_DATASET;
}

function getServerSnapshot(): DatasetId {
  return DEFAULT_DATASET;
}

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const dataset = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function setDataset(next: DatasetId) {
    window.localStorage.setItem(STORAGE_KEY, next);
    // localStorage writes don't fire a `storage` event in the same tab that
    // made them, so nudge this tab's subscribers directly.
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }

  return (
    <DatasetContext.Provider value={{ dataset, setDataset }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) {
    throw new Error("useDataset must be used within a DatasetProvider");
  }
  return ctx;
}
