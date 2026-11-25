import { describe, it } from "vitest";

describe("run: report", () => {
  it.todo("prints the spec sample's expected output to stdout and exits 0");
  it.todo("ends every report line with a line ending, the last one included");
  it.todo("prints nothing and exits 0 for empty input");
  it.todo("skips empty lines without reporting them");
});

describe("run: one rejected line stops the report", () => {
  it.todo("writes the rejected line to stderr with its line number");
  it.todo("prints no report and exits 1 when any line was rejected");
  it.todo(
    "stops at the first rejected line, so a later bad line isn't reported",
  );
  it.todo(
    "stops at the first rule rejection too, so no later event is applied",
  );
  it.todo(
    "numbers lines from 1 and counts empty lines, so numbers match the file",
  );
  it.todo("prints no report and exits 1 for a second created");
  it.todo("prints no report and exits 1 for a return with no fill to cancel");
  it.todo(
    "doesn't reject fills and returns before created, which the spec discards, and still prints the report",
  );
  it.todo(
    "prints the README's two-error example: only line 4 on stderr and nothing on stdout",
  );
});

describe("run: input problems", () => {
  it.todo(
    "prints 'usage: rx-report [file]' and its description, and exits 1, with more than one argument",
  );
  it.todo("prints usage and exits 1 with no argument and a terminal on stdin");
  it.todo(
    "prints an error starting 'rx-report: ENOENT' and exits 1 for a missing file",
  );
  it.todo(
    "prints an error starting 'rx-report: EISDIR' and exits 1 for a directory",
  );
  it.todo("writes nothing to stdout when there is no report");
});

describe("describeRejection", () => {
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
