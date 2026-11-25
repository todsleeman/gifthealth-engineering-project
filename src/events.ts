import { EVENT_KINDS, type EventKind, type ParseResult } from "./types.js";

const FIELD_COUNT = 3;

/**
 * Parses one line of input.
 *
 * Returns `undefined` for an empty line, which holds no event. Fields are split on single spaces, so a line
 * with extra, leading or trailing spaces, or anything but three fields, is `wrong-field-count` with the
 * number of fields found, empty fields included. An event name that isn't exactly one of `EVENT_KINDS`,
 * case included, is `unknown-event` with the word found. Patient and drug names are kept as written.
 */
export function parseLine(line: string): ParseResult | undefined {
  if (line === "") {
    return undefined;
  }
  const fields = line.split(" ");
  const [patient, drug, word] = fields;
  if (
    fields.length !== FIELD_COUNT ||
    patient === undefined ||
    drug === undefined ||
    word === undefined
  ) {
    return {
      ok: false,
      rejection: { reason: "wrong-field-count", fieldCount: fields.length },
    };
  }
  if (!isEventKind(word)) {
    return { ok: false, rejection: { reason: "unknown-event", word } };
  }
  return { ok: true, event: { patient, drug, kind: word } };
}

function isEventKind(word: string): word is EventKind {
  return (EVENT_KINDS as readonly string[]).includes(word);
}
