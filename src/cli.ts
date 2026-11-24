#!/usr/bin/env node

export const ExitCode = {
  Success: 0,
  LinesRejected: 1,
  NoReport: 2,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

function main(): void {}

main();
