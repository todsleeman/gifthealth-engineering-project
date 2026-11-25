import { describe, it } from "vitest";

describe("run: report", () => {
  it.todo("prints the spec sample's expected output to stdout and exits 0");
  it.todo("ends every report line with a line ending, the last one included");
  it.todo("prints nothing and exits 0 for empty input");
  it.todo("skips empty lines without reporting them (A12)");
});

describe("run: one rejected line stops the report (S18)", () => {
  it.todo("writes each rejected line to stderr with its line number");
  it.todo("prints no report and exits 1 when any line was rejected");
  it.todo(
    "keeps reading after a rejected line, so every rejected line is listed",
  );
  it.todo(
    "numbers lines from 1 and counts empty lines, so numbers match the file",
  );
  it.todo("writes rejections in line order");
  it.todo("prints no report and exits 1 for a second created (A16)");
  it.todo(
    "prints no report and exits 1 for a return with no fill to cancel (A17)",
  );
  it.todo(
    "doesn't reject fills and returns before created, which the spec discards, and still prints the report",
  );
  it.todo(
    "prints the README's two-error example: line 4 and line 10 on stderr and nothing on stdout",
  );
});

describe("run: input problems (A14, S18)", () => {
  it.todo("prints usage and exits 1 with more than one argument");
  it.todo("prints usage and exits 1 with no argument and a terminal on stdin");
  it.todo("prints an error and exits 1 for a missing file");
  it.todo("prints an error and exits 1 for a directory");
  it.todo("writes nothing to stdout when there is no report");
});

describe("describeRejection (A15)", () => {
  it.todo(
    "describes a wrong field count as 'line 4: expected 3 fields, found 2'",
  );
  it.todo(
    "describes an unknown event as 'line 10: unknown event \"cancelled\" (expected created, filled or returned)'",
  );
  it.todo(
    "describes a second created as 'line 3: prescription Mark B already created'",
  );
  it.todo(
    "describes a return with nothing to cancel as 'line 2: Mark B returned with no fill to cancel'",
  );
});
