import type { Rejection } from "./types.js";

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

/**
 * How to call the command, written to stderr with a usage error, as two lines:
 * `usage: rx-report [file]` and `Reads prescription events from file, or from stdin if no file is given.`
 */
export const USAGE = "";

/**
 * Runs rx-report once.
 *
 * Reads events from the file named in `args`, or from `io.stdin`, numbering lines from 1, empty lines
 * included. At the first rejected line, from the parser or the pharmacy rules, `run` writes that one line to
 * `io.stderr` as `describeRejection` words it, stops reading, and resolves to `NoReport` with nothing written to
 * stdout. At the end of the input, if no line was rejected, the report goes to `io.stdout`, each line ending in
 * `\n`, and `run` resolves to `Success`. It also resolves to `NoReport`, with nothing written to stdout, for a
 * usage error or for input that can't be read. Unreadable input is reported as `rx-report: ` and Node's own error message, such as
 * `rx-report: ENOENT: no such file or directory, open 'events.txt'`. Never exits the process.
 */
export function run(_args: readonly string[], _io: Io): Promise<ExitCode> {
  throw new Error("not implemented");
}

/**
 * The stderr message for a rejected line, without a line ending:
 * `line 4: expected 3 fields, found 2`,
 * `line 10: unknown event "cancelled" (expected created, filled or returned)`,
 * `line 3: prescription Mark B already created`,
 * `line 2: Mark B returned with no fill to cancel`.
 */
export function describeRejection(
  _lineNumber: number,
  _rejection: Rejection,
): string {
  throw new Error("not implemented");
}
