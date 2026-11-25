import { describe, expect, it } from "vitest";
import { Money } from "../src/money.js";
import {
  compareSummaries,
  formatReport,
  formatSummary,
} from "../src/report.js";
import type { PatientSummary } from "../src/types.js";

function summary(
  patient: string,
  netFills: number,
  income = 0,
): PatientSummary {
  return { patient, netFills, income: Money.dollars(income) };
}

const SPEC_SAMPLE = [
  summary("Nick", 0, 0),
  summary("Mark", 2, 9),
  summary("John", 0, -1),
];

function sortedNames(summaries: PatientSummary[]): string[] {
  return [...summaries].sort(compareSummaries).map((s) => s.patient);
}

describe("compareSummaries: report order", () => {
  it("puts the patient with more net fills first", () => {
    expect(sortedNames([summary("Adam", 1), summary("Zed", 3)])).toEqual([
      "Zed",
      "Adam",
    ]);
  });

  it("breaks a tie in net fills by patient name in ascending order", () => {
    expect(sortedNames([summary("Nick", 0), summary("John", 0)])).toEqual([
      "John",
      "Nick",
    ]);
  });

  it("sorts tied names in English alphabetical order, so adam comes before Zed and mark before Mark", () => {
    expect(
      sortedNames([
        summary("Zed", 1),
        summary("Mark", 1),
        summary("adam", 1),
        summary("mark", 1),
      ]),
    ).toEqual(["adam", "mark", "Mark", "Zed"]);
  });

  it("orders the spec sample as Mark, John, Nick", () => {
    expect(sortedNames(SPEC_SAMPLE)).toEqual(["Mark", "John", "Nick"]);
  });
});

describe("formatSummary: line format", () => {
  it("formats 'Mark: 2 fills $9 income' (spec sample)", () => {
    expect(formatSummary(summary("Mark", 2, 9))).toBe(
      "Mark: 2 fills $9 income",
    );
  });

  it("formats negative income as 'John: 0 fills -$1 income' (spec sample)", () => {
    expect(formatSummary(summary("John", 0, -1))).toBe(
      "John: 0 fills -$1 income",
    );
  });

  it("formats zero as 'Nick: 0 fills $0 income' (spec sample)", () => {
    expect(formatSummary(summary("Nick", 0, 0))).toBe(
      "Nick: 0 fills $0 income",
    );
  });

  it("uses '1 fill' for a count of one", () => {
    expect(formatSummary(summary("Ana", 1, 5))).toBe("Ana: 1 fill $5 income");
  });
});

describe("formatReport", () => {
  it("returns one line per summary in report order", () => {
    expect(formatReport(SPEC_SAMPLE)).toEqual([
      "Mark: 2 fills $9 income",
      "John: 0 fills -$1 income",
      "Nick: 0 fills $0 income",
    ]);
  });

  it("leaves the summaries passed in unchanged", () => {
    const summaries = [...SPEC_SAMPLE];
    formatReport(summaries);
    expect(summaries).toEqual(SPEC_SAMPLE);
  });

  it("returns no lines when there are no summaries", () => {
    expect(formatReport([])).toEqual([]);
  });
});
