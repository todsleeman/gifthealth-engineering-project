import type { Rejection } from "./types.js";

export const ExitCode = {
  Success: 0,
  NoReport: 1,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

/** The streams `run` reads and writes, so tests can pass fakes (S11). */
export interface Io {
  readonly stdin: NodeJS.ReadableStream & { readonly isTTY?: boolean };
  readonly stdout: NodeJS.WritableStream;
  readonly stderr: NodeJS.WritableStream;
}

/** How to call the command, written to stderr with a usage error. */
export const USAGE = "";

/**
 * Runs rx-report once (S11).
 *
 * Reads events from the file named in `args`, or from `io.stdin` (A14), numbering lines from 1, empty lines
 * included. Each rejected line goes to `io.stderr` as `describeRejection` words it, as soon as it is read, and
 * reading continues so every rejected line is listed (S18). At the end of the input, if no line was rejected, the
 * report goes to `io.stdout`, each line ending in `\n`, and `run` resolves to `Success`. It resolves to
 * `NoReport`, with nothing written to stdout, if any line was rejected, for a usage error, or for input that
 * can't be read (S18). Never exits the process (A19).
 */
export function run(_args: readonly string[], _io: Io): Promise<ExitCode> {
  throw new Error("not implemented");
}

/**
 * The stderr message for a rejected line, without a line ending (A15, S14):
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
