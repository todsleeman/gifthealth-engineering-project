#!/usr/bin/env node
import { run } from "./app.js";

// A reader that closes early, such as `| head -1`, is not an error. Pipes report it as EPIPE, and the sockets
// Node uses for a child process's stdio on macOS sometimes report it as ENOTCONN.
const READER_GONE = new Set(["EPIPE", "ENOTCONN"]);

process.stdout.on("error", (error: NodeJS.ErrnoException) => {
  if (!READER_GONE.has(error.code ?? "")) {
    throw error;
  }
});

process.exitCode = await run(process.argv.slice(2), {
  stdin: process.stdin,
  stdout: process.stdout,
  stderr: process.stderr,
});
