import type { PatientSummary } from "./types.js";

export function compareSummaries(
  _a: PatientSummary,
  _b: PatientSummary,
): number {
  throw new Error("not implemented");
}

export function formatSummary(_summary: PatientSummary): string {
  throw new Error("not implemented");
}
