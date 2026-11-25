import type { PatientSummary } from "./types.js";

/**
 * Report order: more net fills first, then patient names in English alphabetical order, compared with
 * `localeCompare` and the `"en"` locale so every machine sorts the same. Negative when `a` comes
 * first, positive when `b` does, 0 for equal fills and names that compare equal.
 */
export function compareSummaries(
  _a: PatientSummary,
  _b: PatientSummary,
): number {
  throw new Error("not implemented");
}

/** One report line without a line ending: `Mark: 2 fills $9 income`, or `1 fill` for a count of one. */
export function formatSummary(_summary: PatientSummary): string {
  throw new Error("not implemented");
}

/** The report's lines in report order, without line endings. Doesn't reorder `summaries`. */
export function formatReport(_summaries: readonly PatientSummary[]): string[] {
  throw new Error("not implemented");
}
