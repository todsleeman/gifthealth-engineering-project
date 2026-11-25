import { readFileSync } from "node:fs";
import { Readable, Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { describeRejection, ExitCode, run, type Io } from "../src/app.js";

const SAMPLE = readFileSync("tests/fixtures/spec-sample.txt", "utf8");
const EXPECTED = readFileSync(
  "tests/fixtures/spec-sample.expected.txt",
  "utf8",
);
const TWO_ERRORS = "tests/fixtures/two-errors.txt";
const USAGE_TEXT =
  "usage: rx-report [file]\nReads prescription events from file, or from stdin if no file is given.\n";

/** Runs with `input` on a fake stdin and returns the exit code and everything written to stdout and stderr. */
async function runWith(
  args: string[],
  input = "",
  { isTTY = false } = {},
): Promise<{ code: ExitCode; stdout: string; stderr: string }> {
  let stdout = "";
  let stderr = "";
  const collect = (append: (text: string) => void) =>
    new Writable({
      write(chunk: Buffer, _encoding, done) {
        append(chunk.toString());
        done();
      },
    });
  const io: Io = {
    stdin: Object.assign(Readable.from(input === "" ? [] : [input]), {
      isTTY,
    }),
    stdout: collect((text) => (stdout += text)),
    stderr: collect((text) => (stderr += text)),
  };
  const code = await run(args, io);
  return { code, stdout, stderr };
}

describe("run: report", () => {
  it("prints the spec sample's expected output to stdout and exits 0", async () => {
    expect(await runWith([], SAMPLE)).toEqual({
      code: ExitCode.Success,
      stdout: EXPECTED,
      stderr: "",
    });
  });

  it("ends every report line with a line ending, the last one included", async () => {
    const { stdout } = await runWith([], "Nick A created\nMark B created");
    expect(stdout).toBe("Mark: 0 fills $0 income\nNick: 0 fills $0 income\n");
  });

  it("prints nothing and exits 0 for empty input", async () => {
    expect(await runWith([], "")).toEqual({
      code: ExitCode.Success,
      stdout: "",
      stderr: "",
    });
  });

  it("skips empty lines without reporting them", async () => {
    expect(await runWith([], "\nNick A created\n\n\n")).toEqual({
      code: ExitCode.Success,
      stdout: "Nick: 0 fills $0 income\n",
      stderr: "",
    });
  });
});

describe("run: one rejected line stops the report", () => {
  it("writes the rejected line to stderr with its line number", async () => {
    const { stderr } = await runWith([], "Nick A created\nMark B\n");
    expect(stderr).toBe("line 2: expected 3 fields, found 2\n");
  });

  it("prints no report and exits 1 when any line was rejected", async () => {
    const { code, stdout } = await runWith([], `${SAMPLE}Mark B\n`);
    expect(code).toBe(ExitCode.NoReport);
    expect(stdout).toBe("");
  });

  it("stops at the first rejected line, so a later bad line isn't reported", async () => {
    const { stderr } = await runWith(
      [],
      "Mark B\nJohn E cancelled\nMark B created\nMark B created\n",
    );
    expect(stderr).toBe("line 1: expected 3 fields, found 2\n");
  });

  it("stops at the first rule rejection too, so a later bad line isn't reported", async () => {
    const { stderr } = await runWith(
      [],
      "Mark B created\nMark B returned\nMark B created\nJohn E cancelled\n",
    );
    expect(stderr).toBe("line 2: Mark B returned with no fill to cancel\n");
  });

  it("numbers lines from 1 and counts empty lines, so numbers match the file", async () => {
    const { stderr } = await runWith(
      [],
      "\nNick A created\n\nNick A Created\n",
    );
    expect(stderr).toBe(
      'line 4: unknown event "Created" (expected created, filled or returned)\n',
    );
  });

  it("prints no report and exits 1 for a second created", async () => {
    expect(await runWith([], "Mark B created\nMark B created\n")).toEqual({
      code: ExitCode.NoReport,
      stdout: "",
      stderr: "line 2: prescription Mark B already created\n",
    });
  });

  it("prints no report and exits 1 for a return with no fill to cancel", async () => {
    expect(await runWith([], "Mark B created\nMark B returned\n")).toEqual({
      code: ExitCode.NoReport,
      stdout: "",
      stderr: "line 2: Mark B returned with no fill to cancel\n",
    });
  });

  it("doesn't reject fills and returns before created, which the spec discards, and still prints the report", async () => {
    expect(
      await runWith(
        [],
        "Mark B filled\nMark B returned\nMark B filled\nMark B created\n",
      ),
    ).toEqual({
      code: ExitCode.Success,
      stdout: "Mark: 0 fills $0 income\n",
      stderr: "",
    });
  });

  it("prints the README's two-error example: only line 4 on stderr and nothing on stdout", async () => {
    expect(await runWith([TWO_ERRORS])).toEqual({
      code: ExitCode.NoReport,
      stdout: "",
      stderr: "line 4: expected 3 fields, found 2\n",
    });
  });

  it("reports line 10 of the README's two-error example once line 4 is fixed", async () => {
    const fixed = readFileSync(TWO_ERRORS, "utf8").replace(
      "Mark B\n",
      "Mark B filled\n",
    );
    const { stderr } = await runWith([], fixed);
    expect(stderr).toBe(
      'line 10: unknown event "cancelled" (expected created, filled or returned)\n',
    );
  });
});

describe("run: input problems", () => {
  it("prints 'usage: rx-report [file]' and its description, and exits 1, with more than one argument", async () => {
    expect(await runWith(["a.txt", "b.txt"])).toEqual({
      code: ExitCode.NoReport,
      stdout: "",
      stderr: `rx-report: expected at most one file, got 2 arguments\n${USAGE_TEXT}`,
    });
  });

  it("prints usage and exits 1 with no argument and a terminal on stdin", async () => {
    expect(await runWith([], "", { isTTY: true })).toEqual({
      code: ExitCode.NoReport,
      stdout: "",
      stderr: `rx-report: no file given and stdin is a terminal\n${USAGE_TEXT}`,
    });
  });

  it("prints an error starting 'rx-report: ENOENT' and exits 1 for a missing file", async () => {
    const { code, stderr } = await runWith(["tests/fixtures/no-such-file.txt"]);
    expect(code).toBe(ExitCode.NoReport);
    expect(stderr).toMatch(/^rx-report: ENOENT.*\n$/);
  });

  it("prints an error starting 'rx-report: EISDIR' and exits 1 for a directory", async () => {
    const { code, stderr } = await runWith(["tests/fixtures"]);
    expect(code).toBe(ExitCode.NoReport);
    expect(stderr).toMatch(/^rx-report: EISDIR.*\n$/);
  });

  it("writes nothing to stdout when there is no report", async () => {
    const results = await Promise.all([
      runWith(["a.txt", "b.txt"]),
      runWith([], "", { isTTY: true }),
      runWith(["tests/fixtures/no-such-file.txt"]),
      runWith(["tests/fixtures"]),
      runWith([TWO_ERRORS]),
    ]);
    expect(results.map(({ stdout }) => stdout)).toEqual(["", "", "", "", ""]);
  });
});

describe("describeRejection", () => {
  const event = { patient: "Mark", drug: "B", kind: "created" } as const;

  it("describes a wrong field count as 'line 4: expected 3 fields, found 2'", () => {
    expect(
      describeRejection(4, { reason: "wrong-field-count", fieldCount: 2 }),
    ).toBe("line 4: expected 3 fields, found 2");
  });

  it("describes an unknown event as 'line 10: unknown event \"cancelled\" (expected created, filled or returned)'", () => {
    expect(
      describeRejection(10, { reason: "unknown-event", word: "cancelled" }),
    ).toBe(
      'line 10: unknown event "cancelled" (expected created, filled or returned)',
    );
  });

  it("describes a second created as 'line 3: prescription Mark B already created'", () => {
    expect(describeRejection(3, { reason: "duplicate-created", event })).toBe(
      "line 3: prescription Mark B already created",
    );
  });

  it("describes a return with nothing to cancel as 'line 2: Mark B returned with no fill to cancel'", () => {
    expect(
      describeRejection(2, {
        reason: "nothing-to-return",
        event: { ...event, kind: "returned" },
      }),
    ).toBe("line 2: Mark B returned with no fill to cancel");
  });
});
