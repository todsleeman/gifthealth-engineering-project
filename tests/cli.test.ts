import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CLI = "dist/cli.js";
const SAMPLE = "tests/fixtures/spec-sample.txt";
const EXPECTED = readFileSync(
  "tests/fixtures/spec-sample.expected.txt",
  "utf8",
);
const TWO_ERRORS = "tests/fixtures/two-errors.txt";

function rxReport(args: string[], input?: string) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    input: input ?? "",
  });
}

describe("rx-report, the built CLI (acceptance)", () => {
  it("prints the spec's expected output byte for byte from a file argument", () => {
    const result = rxReport([SAMPLE]);
    expect(result.stdout).toBe(EXPECTED);
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });

  it("prints the spec's expected output byte for byte from stdin", () => {
    const result = rxReport([], readFileSync(SAMPLE, "utf8"));
    expect(result.stdout).toBe(EXPECTED);
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });

  it("exits 1, reports only the first bad line on stderr and prints nothing on stdout for the README's two-error example", () => {
    const result = rxReport([TWO_ERRORS]);
    expect(result.stderr).toBe("line 4: expected 3 fields, found 2\n");
    expect(result.stdout).toBe("");
    expect(result.status).toBe(1);
  });

  it("exits 1 with an error on stderr and nothing on stdout for a missing file", () => {
    const result = rxReport(["tests/fixtures/no-such-file.txt"]);
    expect(result.stderr).toMatch(/^rx-report: ENOENT/);
    expect(result.stdout).toBe("");
    expect(result.status).toBe(1);
  });
});
