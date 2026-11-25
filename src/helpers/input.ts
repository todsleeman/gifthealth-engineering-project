import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";

const BYTE_ORDER_MARK = "\uFEFF";

/** Where to read events from, or why the command was called wrongly. */
export type InputSource =
  | { readonly kind: "file"; readonly path: string }
  | { readonly kind: "stdin" }
  | { readonly kind: "usage-error"; readonly message: string };

/** An input source that can be opened: a file or stdin. */
export type ReadableSource = Exclude<InputSource, { kind: "usage-error" }>;

/**
 * Where to read events from.
 *
 * One argument is a file, whatever is on stdin. No argument means stdin, unless stdin is a terminal, which is a
 * usage error so the command doesn't sit waiting for input. More than one argument is a usage error. A usage
 * error's message says what was wrong, without a line ending.
 */
export function chooseInput(
  args: readonly string[],
  stdinIsTTY: boolean,
): InputSource {
  const [path, ...rest] = args;
  if (rest.length > 0) {
    return {
      kind: "usage-error",
      message: `expected at most one file, got ${args.length} arguments`,
    };
  }
  if (path !== undefined) {
    return { kind: "file", path };
  }
  if (stdinIsTTY) {
    return {
      kind: "usage-error",
      message: "no file given and stdin is a terminal",
    };
  }
  return { kind: "stdin" };
}

/**
 * The stream to read for `source`: a read stream of the file, or `stdin`. It doesn't check the file first:
 * a missing file or a directory surfaces as an error from `readLines` before any line is yielded.
 */
export function openInput(
  source: ReadableSource,
  stdin: NodeJS.ReadableStream,
): NodeJS.ReadableStream {
  return source.kind === "file" ? createReadStream(source.path) : stdin;
}

/**
 * The stream's lines in order, without line endings. `\r\n` counts as one line ending, empty lines are yielded
 * so line numbers match the file, and a final line ending doesn't add an empty line. Rejects if the stream
 * errors, including with `ENOENT` for a missing file and `EISDIR` for a directory. A byte order mark at the
 * very start of the input is dropped, so it doesn't become part of the first patient's name.
 *
 * Once reading stops, at the end of the stream, on an error, or because the caller stopped iterating early, a
 * stream that is a Node `Readable` (as files and stdin are) is destroyed, so an open file is released.
 */
export async function* readLines(
  stream: NodeJS.ReadableStream,
): AsyncIterable<string> {
  const lines = createInterface({ input: stream, crlfDelay: Infinity });
  try {
    let first = true;
    for await (const line of lines) {
      yield first && line.startsWith(BYTE_ORDER_MARK) ? line.slice(1) : line;
      first = false;
    }
  } finally {
    lines.close();
    if (stream instanceof Readable) {
      stream.destroy();
    }
  }
}
