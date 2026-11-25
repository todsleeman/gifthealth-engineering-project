import { describe, expect, it } from "vitest";
import { Pharmacy } from "../src/pharmacy.js";
import type { EventKind, PrescriptionEvent } from "../src/types.js";

function event(line: string): PrescriptionEvent {
  const [patient = "", drug = "", kind = ""] = line.split(" ");
  return { patient, drug, kind: kind as EventKind };
}

/** Applies each line in order and fails the test if any is rejected. */
function pharmacyAfter(...lines: string[]): Pharmacy {
  const pharmacy = new Pharmacy();
  for (const line of lines) {
    expect(pharmacy.apply(event(line)), line).toBeUndefined();
  }
  return pharmacy;
}

/** Summaries as plain `[patient, netFills, income]` rows, sorted by patient. */
function totals(pharmacy: Pharmacy): [string, number, string][] {
  return pharmacy
    .summaries()
    .map((s): [string, number, string] => [
      s.patient,
      s.netFills,
      s.income.format(),
    ])
    .sort(([a], [b]) => a.localeCompare(b, "en"));
}

describe("created", () => {
  it("a created prescription with no fills gives its patient 0 fills and $0 income (spec sample: Nick)", () => {
    expect(totals(pharmacyAfter("Nick A created"))).toEqual([
      ["Nick", 0, "$0"],
    ]);
  });

  it("a prescription is a patient and a drug, so the same patient with another drug is a separate prescription", () => {
    const pharmacy = pharmacyAfter("Mark B created", "Mark C created");
    expect(pharmacy.apply(event("Mark C returned"))).toEqual({
      reason: "nothing-to-return",
      event: event("Mark C returned"),
    });
    expect(pharmacy.apply(event("Mark B filled"))).toBeUndefined();
    expect(pharmacy.apply(event("Mark C filled"))).toBeUndefined();
    expect(totals(pharmacy)).toEqual([["Mark", 2, "$10"]]);
  });

  it("a second created for the same patient and drug is rejected as duplicate-created", () => {
    const pharmacy = pharmacyAfter("Mark B created");
    expect(pharmacy.apply(event("Mark B created"))).toEqual({
      reason: "duplicate-created",
      event: event("Mark B created"),
    });
  });

  it("a second created leaves the prescription's fills and returns unchanged", () => {
    const pharmacy = pharmacyAfter(
      "Mark B created",
      "Mark B filled",
      "Mark B filled",
      "Mark B returned",
    );
    pharmacy.apply(event("Mark B created"));
    expect(totals(pharmacy)).toEqual([["Mark", 1, "$4"]]);
  });
});

describe("filled", () => {
  it("each fill adds one fill and $5 income", () => {
    expect(totals(pharmacyAfter("Mark B created", "Mark B filled"))).toEqual([
      ["Mark", 1, "$5"],
    ]);
  });

  it("a prescription can be filled many times", () => {
    const pharmacy = pharmacyAfter(
      "Mark B created",
      "Mark B filled",
      "Mark B filled",
      "Mark B filled",
    );
    expect(totals(pharmacy)).toEqual([["Mark", 3, "$15"]]);
  });

  it("a fill before created is discarded without a rejection", () => {
    expect(new Pharmacy().apply(event("Paul D filled"))).toBeUndefined();
  });

  it("a fill before created still doesn't count once the prescription is created", () => {
    const pharmacy = pharmacyAfter("Paul D filled", "Paul D created");
    expect(totals(pharmacy)).toEqual([["Paul", 0, "$0"]]);
  });
});

describe("returned", () => {
  it("a return cancels one fill and costs $1", () => {
    const pharmacy = pharmacyAfter(
      "Mark B created",
      "Mark B filled",
      "Mark B filled",
      "Mark B returned",
    );
    expect(totals(pharmacy)).toEqual([["Mark", 1, "$4"]]);
  });

  it("a return keeps its $1 loss even if the prescription is filled again later", () => {
    const pharmacy = pharmacyAfter(
      "Mark B created",
      "Mark B filled",
      "Mark B returned",
      "Mark B filled",
    );
    expect(totals(pharmacy)).toEqual([["Mark", 1, "$4"]]);
  });

  it("a return before created is discarded without a rejection", () => {
    const pharmacy = pharmacyAfter("Mark B returned", "Mark B created");
    expect(totals(pharmacy)).toEqual([["Mark", 0, "$0"]]);
  });

  it("a return with no fill at all is rejected as nothing-to-return, with no $1 charged", () => {
    const pharmacy = pharmacyAfter("Mark B created");
    expect(pharmacy.apply(event("Mark B returned"))).toEqual({
      reason: "nothing-to-return",
      event: event("Mark B returned"),
    });
    expect(totals(pharmacy)).toEqual([["Mark", 0, "$0"]]);
  });

  it("a second return for a single fill is rejected as nothing-to-return", () => {
    const pharmacy = pharmacyAfter(
      "Mark B created",
      "Mark B filled",
      "Mark B returned",
    );
    expect(pharmacy.apply(event("Mark B returned"))).toEqual({
      reason: "nothing-to-return",
      event: event("Mark B returned"),
    });
    expect(totals(pharmacy)).toEqual([["Mark", 0, "-$1"]]);
  });

  it("a return whose only fill came before created is discarded with that fill, with no $1 charged", () => {
    const pharmacy = pharmacyAfter(
      "Mark B filled",
      "Mark B created",
      "Mark B returned",
    );
    expect(totals(pharmacy)).toEqual([["Mark", 0, "$0"]]);
  });

  it("a return cancels a fill made after created before it uses up a fill discarded before created, and costs $1", () => {
    const pharmacy = pharmacyAfter(
      "Mark B filled",
      "Mark B created",
      "Mark B filled",
      "Mark B returned",
    );
    expect(totals(pharmacy)).toEqual([["Mark", 0, "-$1"]]);
    expect(pharmacy.apply(event("Mark B returned"))).toBeUndefined();
    expect(totals(pharmacy)).toEqual([["Mark", 0, "-$1"]]);
  });

  it("a second return after that is still rejected, as one discarded fill accounts for one return", () => {
    const pharmacy = pharmacyAfter(
      "Mark B filled",
      "Mark B created",
      "Mark B returned",
    );
    expect(pharmacy.apply(event("Mark B returned"))).toEqual({
      reason: "nothing-to-return",
      event: event("Mark B returned"),
    });
  });

  it("a return before created uses up a fill before created, so a later return with nothing to cancel is rejected", () => {
    const pharmacy = pharmacyAfter(
      "Mark B filled",
      "Mark B returned",
      "Mark B created",
    );
    expect(pharmacy.apply(event("Mark B returned"))).toEqual({
      reason: "nothing-to-return",
      event: event("Mark B returned"),
    });
  });

  it("a return only cancels a fill of its own prescription, so Mark C returned doesn't cancel a Mark B fill", () => {
    const pharmacy = pharmacyAfter(
      "Mark B created",
      "Mark C created",
      "Mark B filled",
    );
    expect(pharmacy.apply(event("Mark C returned"))).toEqual({
      reason: "nothing-to-return",
      event: event("Mark C returned"),
    });
    expect(totals(pharmacy)).toEqual([["Mark", 1, "$5"]]);
  });
});

describe("summaries", () => {
  it("lists only patients with at least one created prescription (Who appears in the report)", () => {
    const pharmacy = pharmacyAfter(
      "Nick A created",
      "Paul D filled",
      "Zoe F returned",
    );
    expect(totals(pharmacy).map(([patient]) => patient)).toEqual(["Nick"]);
  });

  it("leaves out a patient whose only events were discarded (spec sample: Paul)", () => {
    expect(totals(pharmacyAfter("Paul D filled"))).toEqual([]);
  });

  it("adds fills and income across a patient's prescriptions (spec sample: Mark B and Mark C)", () => {
    const pharmacy = pharmacyAfter(
      "Mark B created",
      "Mark C created",
      "Mark B filled",
      "Mark B filled",
      "Mark C filled",
      "Mark C returned",
    );
    expect(totals(pharmacy)).toEqual([["Mark", 2, "$9"]]);
  });

  it("gives the spec sample's totals: Mark 2 fills $9, John 0 fills -$1, Nick 0 fills $0", () => {
    const pharmacy = pharmacyAfter(
      "Nick A created",
      "Mark B created",
      "Mark B filled",
      "Mark C filled",
      "Mark B returned",
      "John E created",
      "Mark B filled",
      "Mark B filled",
      "Paul D filled",
      "John E filled",
      "John E returned",
    );
    expect(totals(pharmacy)).toEqual([
      ["John", 0, "-$1"],
      ["Mark", 2, "$9"],
      ["Nick", 0, "$0"],
    ]);
  });

  it("a new Pharmacy starts empty, so runs never share state", () => {
    pharmacyAfter("Mark B created", "Mark B filled");
    expect(new Pharmacy().summaries()).toEqual([]);
  });
});
