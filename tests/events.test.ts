import { describe, it } from "vitest";

describe("parseLine: line format", () => {
  it.todo("parses 'Nick A created' into patient Nick, drug A and kind created");
  it.todo("parses each event kind: created, filled and returned");
  it.todo("returns undefined for an empty line, which holds no event");
  it.todo(
    "rejects a line with fewer than three fields as wrong-field-count with the count found",
  );
  it.todo(
    "rejects a line with more than three fields as wrong-field-count with the count found",
  );
  it.todo(
    "rejects two spaces between fields as wrong-field-count, counting the empty field, so 'Mark  B filled' has 4",
  );
  it.todo("rejects a leading space");
  it.todo("rejects a trailing space");
});

describe("parseLine: event names", () => {
  it.todo("rejects an unknown event name as unknown-event with the word found");
  it.todo("matches event names exactly, so 'Filled' is an unknown event");
});

describe("parseLine: names", () => {
  it.todo(
    "accepts any patient and drug name without spaces, not only single letters",
  );
  it.todo("keeps names exactly as written, case included");
});
