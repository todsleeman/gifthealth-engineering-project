#!/usr/bin/env node
import { run } from "./app.js";

// A reader that stops early, such as `| head -1`, closes the pipe. That ends the report, not the run with an error.
process.stdout.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code !== "EPIPE") {
    throw error;
  }
});

process.exitCode = await run(process.argv.slice(2), {
  stdin: process.stdin,
  stdout: process.stdout,
  stderr: process.stderr,
});
