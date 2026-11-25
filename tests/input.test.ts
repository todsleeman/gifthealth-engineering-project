import { describe, it } from "vitest";

describe("chooseInput: input source", () => {
  it.todo("reads the named file when one argument is given");
  it.todo("reads the named file and ignores stdin when input is also piped");
  it.todo("reads stdin when no argument is given and stdin isn't a terminal");
  it.todo("is a usage error when no argument is given and stdin is a terminal");
  it.todo("is a usage error when more than one argument is given");
});

describe("openInput", () => {
  it.todo("returns stdin for the stdin source");
  it.todo("returns a stream of the named file");
});

describe("readLines", () => {
  it.todo("yields each line without its line ending");
  it.todo("treats \\r\\n as one line ending, so Windows files work");
  it.todo("yields empty lines, so line numbers match the file");
  it.todo("doesn't yield an extra empty line after a final line ending");
  it.todo("yields the last line when the input doesn't end with a line ending");
  it.todo("yields nothing for empty input");
  it.todo("rejects for a missing file before yielding any line");
  it.todo("rejects for a directory before yielding any line");
});
