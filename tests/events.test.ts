import { describe, expect, it } from "vitest";
import { parseLine } from "../src/events.js";

describe("parseLine: line format", () => {
  it("parses 'Nick A created' into patient Nick, drug A and kind created", () => {
    expect(parseLine("Nick A created")).toEqual({
      ok: true,
      event: { patient: "Nick", drug: "A", kind: "created" },
    });
  });

  it("parses each event kind: created, filled and returned", () => {
    for (const kind of ["created", "filled", "returned"]) {
      expect(parseLine(`Mark B ${kind}`)).toEqual({
        ok: true,
        event: { patient: "Mark", drug: "B", kind },
      });
    }
  });

  it("returns undefined for an empty line, which holds no event", () => {
    expect(parseLine("")).toBeUndefined();
  });

  it("rejects a line with fewer than three fields as wrong-field-count with the count found", () => {
    expect(parseLine("Mark B")).toEqual({
      ok: false,
      rejection: { reason: "wrong-field-count", fieldCount: 2 },
    });
    expect(parseLine("Mark")).toEqual({
      ok: false,
      rejection: { reason: "wrong-field-count", fieldCount: 1 },
    });
  });

  it("rejects a line with more than three fields as wrong-field-count with the count found", () => {
    expect(parseLine("Mark B filled today")).toEqual({
      ok: false,
      rejection: { reason: "wrong-field-count", fieldCount: 4 },
    });
  });

  it("rejects two spaces between fields as wrong-field-count, counting the empty field, so 'Mark  B filled' has 4", () => {
    expect(parseLine("Mark  B filled")).toEqual({
      ok: false,
      rejection: { reason: "wrong-field-count", fieldCount: 4 },
    });
  });

  it("rejects a leading space", () => {
    expect(parseLine(" Mark B filled")).toEqual({
      ok: false,
      rejection: { reason: "wrong-field-count", fieldCount: 4 },
    });
  });

  it("rejects a trailing space", () => {
    expect(parseLine("Mark B filled ")).toEqual({
      ok: false,
      rejection: { reason: "wrong-field-count", fieldCount: 4 },
    });
  });
});

describe("parseLine: event names", () => {
  it("rejects an unknown event name as unknown-event with the word found", () => {
    expect(parseLine("John E cancelled")).toEqual({
      ok: false,
      rejection: { reason: "unknown-event", word: "cancelled" },
    });
  });

  it("matches event names exactly, so 'Filled' is an unknown event", () => {
    expect(parseLine("Mark B Filled")).toEqual({
      ok: false,
      rejection: { reason: "unknown-event", word: "Filled" },
    });
  });
});

describe("parseLine: names", () => {
  it("accepts any patient and drug name without spaces, not only single letters", () => {
    expect(parseLine("Ana-María Amoxicillin_500mg filled")).toEqual({
      ok: true,
      event: {
        patient: "Ana-María",
        drug: "Amoxicillin_500mg",
        kind: "filled",
      },
    });
  });

  it("keeps names exactly as written, case included", () => {
    expect(parseLine("mark b filled")).toEqual({
      ok: true,
      event: { patient: "mark", drug: "b", kind: "filled" },
    });
  });
});
