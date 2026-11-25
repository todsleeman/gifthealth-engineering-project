import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { chooseInput, openInput, readLines } from "../src/input.js";

const SAMPLE = "tests/fixtures/spec-sample.txt";

async function collect(lines: AsyncIterable<string>): Promise<string[]> {
  const result: string[] = [];
  for await (const line of lines) {
    result.push(line);
  }
  return result;
}

function linesOf(...chunks: string[]): Promise<string[]> {
  return collect(readLines(Readable.from(chunks)));
}

describe("chooseInput: input source", () => {
  it("reads the named file when one argument is given", () => {
    expect(chooseInput(["events.txt"], true)).toEqual({
      kind: "file",
      path: "events.txt",
    });
  });

  it("reads the named file and ignores stdin when input is also piped", () => {
    expect(chooseInput(["events.txt"], false)).toEqual({
      kind: "file",
      path: "events.txt",
    });
  });

  it("reads stdin when no argument is given and stdin isn't a terminal", () => {
    expect(chooseInput([], false)).toEqual({ kind: "stdin" });
  });

  it("is a usage error when no argument is given and stdin is a terminal", () => {
    expect(chooseInput([], true)).toEqual({
      kind: "usage-error",
      message: "no file given and stdin is a terminal",
    });
  });

  it("is a usage error when more than one argument is given", () => {
    expect(chooseInput(["a.txt", "b.txt"], false)).toEqual({
      kind: "usage-error",
      message: "expected at most one file, got 2 arguments",
    });
  });
});

describe("openInput", () => {
  it("returns stdin for the stdin source", () => {
    const stdin = Readable.from([]);
    expect(openInput({ kind: "stdin" }, stdin)).toBe(stdin);
  });

  it("returns a stream of the named file", async () => {
    const stream = openInput({ kind: "file", path: SAMPLE }, Readable.from([]));
    const lines = await collect(readLines(stream));
    expect(lines[0]).toBe("Nick A created");
    expect(lines).toHaveLength(11);
  });
});

describe("readLines", () => {
  it("yields each line without its line ending", async () => {
    expect(await linesOf("Nick A created\nMark B created\n")).toEqual([
      "Nick A created",
      "Mark B created",
    ]);
  });

  it("treats \\r\\n as one line ending, so Windows files work", async () => {
    expect(await linesOf("Nick A created\r\nMark B created\r\n")).toEqual([
      "Nick A created",
      "Mark B created",
    ]);
    expect(await linesOf("Nick A created\r", "\nMark B created")).toEqual([
      "Nick A created",
      "Mark B created",
    ]);
  });

  it("yields empty lines, so line numbers match the file", async () => {
    expect(await linesOf("a\n\nb\n")).toEqual(["a", "", "b"]);
  });

  it("doesn't yield an extra empty line after a final line ending", async () => {
    expect(await linesOf("a\n")).toEqual(["a"]);
  });

  it("yields the last line when the input doesn't end with a line ending", async () => {
    expect(await linesOf("a\nb")).toEqual(["a", "b"]);
  });

  it("yields nothing for empty input", async () => {
    expect(await linesOf()).toEqual([]);
  });

  it("rejects for a missing file before yielding any line", async () => {
    const lines: string[] = [];
    const reading = (async () => {
      for await (const line of readLines(
        createReadStream("tests/fixtures/no-such-file.txt"),
      )) {
        lines.push(line);
      }
    })();
    await expect(reading).rejects.toMatchObject({ code: "ENOENT" });
    expect(lines).toEqual([]);
  });

  it("rejects for a directory before yielding any line", async () => {
    const lines: string[] = [];
    const reading = (async () => {
      for await (const line of readLines(createReadStream("tests/fixtures"))) {
        lines.push(line);
      }
    })();
    await expect(reading).rejects.toMatchObject({ code: "EISDIR" });
    expect(lines).toEqual([]);
  });

  it("closes the stream when the caller stops reading early", async () => {
    const stream = createReadStream(SAMPLE);
    for await (const line of readLines(stream)) {
      expect(line).toBe("Nick A created");
      break;
    }
    expect(stream.destroyed).toBe(true);
  });
});
