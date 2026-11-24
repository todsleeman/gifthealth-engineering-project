import { describe, it } from "vitest";

describe("run: report", () => {
  it.todo("prints the spec sample's expected output to stdout and exits 0");
  it.todo("ends every report line with a line ending, the last one included");
  it.todo("prints nothing and exits 0 for empty input");
  it.todo("skips empty lines without reporting them (A12)");
});

describe("run: rejected lines (A15, A18)", () => {
  it.todo(
    "writes each rejected line to stderr with its line number and still prints the report",
  );
  it.todo("exits 1 when any line was rejected");
  it.todo(
    "numbers lines from 1 and counts empty lines, so numbers match the file",
  );
  it.todo("writes rejections in line order, before the report");
  it.todo("reports a second created on stderr and exits 1 (A16)");
  it.todo(
    "reports a return with no fill to cancel on stderr and exits 1 (A17)",
  );
  it.todo(
    "doesn't report fills and returns before created, which the spec discards",
  );
  it.todo(
    "prints the README's two-error example: line 4 and line 10 on stderr, the spec's report on stdout",
  );
});

describe("run: no report (A14, A18)", () => {
  it.todo("prints usage and exits 2 with more than one argument");
  it.todo("prints usage and exits 2 with no argument and a terminal on stdin");
  it.todo("prints an error and exits 2 for a missing file");
  it.todo("prints an error and exits 2 for a directory");
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
