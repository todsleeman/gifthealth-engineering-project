export type InputSource =
  | { readonly kind: "file"; readonly path: string }
  | { readonly kind: "stdin" }
  | { readonly kind: "usage-error"; readonly message: string };

export type ReadableSource = Exclude<InputSource, { kind: "usage-error" }>;

/**
 * Where to read events from (A14, S10).
 *
 * One argument is a file, whatever is on stdin. No argument means stdin, unless stdin is a terminal, which is a
 * usage error so the command doesn't sit waiting for input. More than one argument is a usage error.
 */
export function chooseInput(
  _args: readonly string[],
  _stdinIsTTY: boolean,
): InputSource {
  throw new Error("not implemented");
}

/**
 * The stream to read for `source`: the opened file, or `stdin`. Rejects with the file system error for a missing
 * or unreadable file or a directory, before any line is read (A18).
 */
export function openInput(
  _source: ReadableSource,
  _stdin: NodeJS.ReadableStream,
): Promise<NodeJS.ReadableStream> {
  throw new Error("not implemented");
}

/**
 * The stream's lines in order, without line endings. `\r\n` counts as one line ending, empty lines are yielded
 * so line numbers match the file, and a final line ending doesn't add an empty line. Rejects if the stream
 * errors.
 */
export function readLines(
  _stream: NodeJS.ReadableStream,
): AsyncIterable<string> {
  throw new Error("not implemented");
}
