import { isBinId, isFineId, type BinId, type FineId } from "@/lib/bins";

export type SortRecord = {
  id: string;
  at: number;
  modelFine: FineId;
  modelConfidence: number;
  bin: BinId;
  corrected: boolean;
  thumb: string;
};

const KEY = "ecosort.history.v1";
const MAX = 40;

function isRecord(value: unknown): value is SortRecord {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<SortRecord>;
  return (
    typeof row.id === "string" &&
    typeof row.at === "number" &&
    isFineId(row.modelFine) &&
    typeof row.modelConfidence === "number" &&
    isBinId(row.bin) &&
    typeof row.corrected === "boolean" &&
    typeof row.thumb === "string"
  );
}

export function readHistory(): SortRecord[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord).slice(0, MAX);
  } catch {
    return [];
  }
}

export function writeHistory(rows: SortRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, MAX)));
}
