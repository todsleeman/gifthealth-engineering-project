import type { PatientSummary } from "./types.js";

/**
 * Report order: more net fills first, then patient names in English alphabetical order, compared with
 * `localeCompare` and the `"en"` locale so every machine sorts the same. Negative when `a` comes
 * first, positive when `b` does, 0 for equal fills and names that compare equal.
 */
export function compareSummaries(a: PatientSummary, b: PatientSummary): number {
  return b.netFills - a.netFills || a.patient.localeCompare(b.patient, "en");
}

/** One report line without a line ending: `Mark: 2 fills $9 income`, or `1 fill` for a count of one. */
export function formatSummary({
  patient,
  netFills,
  income,
}: PatientSummary): string {
  const fills = netFills === 1 ? "fill" : "fills";
  return `${patient}: ${netFills} ${fills} ${income.format()} income`;
}

/** The report's lines in report order, without line endings. Doesn't reorder `summaries`. */
export function formatReport(summaries: readonly PatientSummary[]): string[] {
  return summaries.toSorted(compareSummaries).map(formatSummary);
}
