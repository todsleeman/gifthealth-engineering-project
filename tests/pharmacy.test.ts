import { describe, it } from "vitest";

describe("created", () => {
  it.todo(
    "a created prescription with no fills gives its patient 0 fills and $0 income (spec sample: Nick)",
  );
  it.todo(
    "a prescription is a patient and a drug, so the same patient with another drug is a separate prescription",
  );
  it.todo(
    "a second created for the same patient and drug is rejected as duplicate-created",
  );
  it.todo(
    "a second created leaves the prescription's fills and returns unchanged",
  );
});

describe("filled", () => {
  it.todo("each fill adds one fill and $5 income");
  it.todo("a prescription can be filled many times");
  it.todo("a fill before created is discarded without a rejection");
  it.todo(
    "a fill before created still doesn't count once the prescription is created",
  );
});

describe("returned", () => {
  it.todo("a return cancels one fill and costs $1");
  it.todo(
    "a return keeps its $1 loss even if the prescription is filled again later",
  );
  it.todo("a return before created is discarded without a rejection");
  it.todo(
    "a return with no fill at all is rejected as nothing-to-return, with no $1 charged",
  );
  it.todo("a second return for a single fill is rejected as nothing-to-return");
  it.todo(
    "a return whose only fill came before created is discarded with that fill, with no $1 charged",
  );
  it.todo(
    "a second return after that is still rejected, as one discarded fill accounts for one return",
  );
  it.todo(
    "a return before created uses up a fill before created, so a later return with nothing to cancel is rejected",
  );
  it.todo(
    "a return only cancels a fill of its own prescription, so Mark C returned doesn't cancel a Mark B fill",
  );
});

describe("summaries", () => {
  it.todo(
    "lists only patients with at least one created prescription (Who appears in the report)",
  );
  it.todo(
    "leaves out a patient whose only events were discarded (spec sample: Paul)",
  );
  it.todo(
    "adds fills and income across a patient's prescriptions (spec sample: Mark B and Mark C)",
  );
  it.todo(
    "gives the spec sample's totals: Mark 2 fills $9, John 0 fills -$1, Nick 0 fills $0",
  );
  it.todo("a new Pharmacy starts empty, so runs never share state");
});
