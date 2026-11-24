import type { ParseResult } from "./types.js";

/**
 * Parses one line of input (S4, S5).
 *
 * Returns `undefined` for an empty line, which holds no event (A12). Fields are split on single spaces, so a
 * line with extra, leading or trailing spaces, or anything but three fields, is `wrong-field-count` with the
 * number of fields found, empty fields included (A12). An event name that isn't exactly one of `EVENT_KINDS`,
 * case included, is `unknown-event` with the word found (A13). Patient and drug names are kept as written (A3).
 */
export function parseLine(_line: string): ParseResult | undefined {
  throw new Error("not implemented");
}
