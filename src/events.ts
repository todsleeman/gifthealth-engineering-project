import type { ParseResult } from "./types.js";

/**
 * Parses one line of input.
 *
 * Returns `undefined` for an empty line, which holds no event. Fields are split on single spaces, so a
 * line with extra, leading or trailing spaces, or anything but three fields, is `wrong-field-count` with the
 * number of fields found, empty fields included. An event name that isn't exactly one of `EVENT_KINDS`,
 * case included, is `unknown-event` with the word found. Patient and drug names are kept as written.
 */
export function parseLine(_line: string): ParseResult | undefined {
  throw new Error("not implemented");
}
