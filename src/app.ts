import { parseLine } from "./events.js";
import { chooseInput, openInput, readLines } from "./input.js";
import { Pharmacy } from "./pharmacy.js";
import { formatReport } from "./report.js";
import { EVENT_KINDS, type Rejection } from "./types.js";

/** `Success`: the report was printed. `NoReport`: it wasn't, and stderr says why. */
export const ExitCode = {
  Success: 0,
  NoReport: 1,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

/** The streams `run` reads and writes, so tests can pass fakes. */
export interface Io {
  readonly stdin: NodeJS.ReadableStream & { readonly isTTY?: boolean };
  readonly stdout: NodeJS.WritableStream;
  readonly stderr: NodeJS.WritableStream;
}

/** How to call the command, written to stderr after a usage error. Two lines, without a final line ending. */
export const USAGE = [
  "usage: rx-report [file]",
  "Reads prescription events from file, or from stdin if no file is given.",
].join("\n");

/**
 * Runs rx-report once.
 *
 * Reads events from the file named in `args`, or from `io.stdin`, numbering lines from 1, empty lines
 * included. At the first rejected line, from the parser or the pharmacy rules, `run` writes that one line to
 * `io.stderr` as `describeRejection` words it, stops reading, and resolves to `NoReport` with nothing written to
 * stdout. At the end of the input, if no line was rejected, the report goes to `io.stdout`, each line ending in
 * `\n`, and `run` resolves to `Success`.
 *
 * It also resolves to `NoReport`, with nothing written to stdout, for a usage error or for input that can't be
 * read. A usage error is written as `rx-report: ` and what was wrong, then `USAGE`. Unreadable input is written
 * as `rx-report: ` and Node's own error message, such as
 * `rx-report: ENOENT: no such file or directory, open 'events.txt'`. Never exits the process.
 */
export async function run(args: readonly string[], io: Io): Promise<ExitCode> {
  const source = chooseInput(args, io.stdin.isTTY === true);
  if (source.kind === "usage-error") {
    io.stderr.write(`rx-report: ${source.message}\n${USAGE}\n`);
    return ExitCode.NoReport;
  }

  const pharmacy = new Pharmacy();
  let lineNumber = 0;
  try {
    for await (const line of readLines(openInput(source, io.stdin))) {
      lineNumber += 1;
      const rejection = applyLine(line, pharmacy);
      if (rejection) {
        io.stderr.write(`${describeRejection(lineNumber, rejection)}\n`);
        return ExitCode.NoReport;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr.write(`rx-report: ${message}\n`);
    return ExitCode.NoReport;
  }

  for (const line of formatReport(pharmacy.summaries())) {
    io.stdout.write(`${line}\n`);
  }
  return ExitCode.Success;
}

/**
 * The stderr message for a rejected line, without a line ending:
 * `line 4: expected 3 fields, found 2`,
 * `line 10: unknown event "cancelled" (expected created, filled or returned)`,
 * `line 3: prescription Mark B already created`,
 * `line 2: Mark B returned with no fill to cancel`.
 */
export function describeRejection(
  lineNumber: number,
  rejection: Rejection,
): string {
  return `line ${lineNumber}: ${reasonText(rejection)}`;
}

/** Parses one line and applies its event. Returns the line's rejection, or `undefined` if it has none. */
function applyLine(line: string, pharmacy: Pharmacy): Rejection | undefined {
  const parsed = parseLine(line);
  if (!parsed) {
    return undefined;
  }
  return parsed.ok ? pharmacy.apply(parsed.event) : parsed.rejection;
}

/** The event names as a list in words: `created, filled or returned`. */
const KNOWN_EVENTS = `${EVENT_KINDS.slice(0, -1).join(", ")} or ${EVENT_KINDS.at(-1)}`;

function reasonText(rejection: Rejection): string {
  switch (rejection.reason) {
    case "wrong-field-count":
      return `expected 3 fields, found ${rejection.fieldCount}`;
    case "unknown-event":
      return `unknown event "${rejection.word}" (expected ${KNOWN_EVENTS})`;
    case "duplicate-created":
      return `prescription ${rejection.event.patient} ${rejection.event.drug} already created`;
    case "nothing-to-return":
      return `${rejection.event.patient} ${rejection.event.drug} returned with no fill to cancel`;
  }
}
