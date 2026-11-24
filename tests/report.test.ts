import { describe, it } from "vitest";

describe("compareSummaries: report order (A10)", () => {
  it.todo("puts the patient with more net fills first");
  it.todo("breaks a tie in net fills by patient name in ascending order");
  it.todo("compares names as plain strings, so Mark comes before mark (S15)");
  it.todo("orders the spec sample as Mark, John, Nick");
});

describe("formatSummary: line format (A11)", () => {
  it.todo("formats 'Mark: 2 fills $9 income' (spec sample)");
  it.todo(
    "formats negative income as 'John: 0 fills -$1 income' (spec sample)",
  );
  it.todo("formats zero as 'Nick: 0 fills $0 income' (spec sample)");
  it.todo("uses '1 fill' for a count of one");
});

describe("formatReport", () => {
  it.todo("returns one line per summary in report order");
  it.todo("leaves the summaries passed in unchanged");
  it.todo("returns no lines when there are no summaries");
});
