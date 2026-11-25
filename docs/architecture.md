# Architecture

rx-report reads prescription events, one per line, and prints fills and income per patient. This page maps the
modules, the data flow and the types. The decisions behind them, with the options that were turned down, are in
[plans/architecture.md](plans/architecture.md) and [plans/scaffolding.md](plans/scaffolding.md).

## Modules

| Module            | Responsibility                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `src/cli.ts`      | The entry point. Hands the arguments and the process's streams to `run`                       |
| `src/app.ts`      | `run`, which connects the modules, numbers lines, writes output and picks the exit code       |
| `src/input.ts`    | Choosing the file or stdin, opening it, and reading it line by line                           |
| `src/events.ts`   | Parsing one line into an event                                                                |
| `src/pharmacy.ts` | The spec's rules (created first, fills, returns) and income                                   |
| `src/money.ts`    | `Money`, the only module that uses Dinero.js                                                  |
| `src/report.ts`   | The report's order and line format                                                            |
| `src/types.ts`    | The domain types the core modules share, and the `EVENT_KINDS` list `EventKind` is built from |

Only `app.ts` and `input.ts` touch streams or files, and `app.ts` reaches them through an `Io` object, so tests
pass fake streams. Everything else takes values and returns values, so the same core could sit behind an HTTP
API.

The domain types the core modules share live in `types.ts`, so the whole data model reads in one file.
`EVENT_KINDS` sits there too, because `EventKind` is built from it. Types for the edge of the program stay with
the code that uses them, so `ExitCode` and `Io` are in `app.ts` and `InputSource` is in `input.ts`. That keeps
I/O types out of the domain file. `Money` is a class with its own behaviour, so it stays in `money.ts`.

## Functions

Every function below is a stub on the scaffolding branch. Its TSDoc comment is its contract, and each one is
built test-first in the functionality plan.

| Module        | Function                                                    | Returns                                                                    |
| ------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| `app.ts`      | `run(args, io)`                                             | The exit code, after writing the report to stdout and rejections to stderr |
| `app.ts`      | `describeRejection(lineNumber, rejection)`                  | The stderr message for one rejected line                                   |
| `input.ts`    | `chooseInput(args, stdinIsTTY)`                             | A file, stdin, or a usage error                                            |
| `input.ts`    | `openInput(source, stdin)`                                  | The stream to read. Fails for a missing file or a directory                |
| `input.ts`    | `readLines(stream)`                                         | The stream's lines, one at a time, without line endings                    |
| `events.ts`   | `parseLine(line)`                                           | An event, a rejection, or `undefined` for an empty line                    |
| `pharmacy.ts` | `new Pharmacy()`, `apply(event)`                            | `undefined` when applied or discarded, or a rejection                      |
| `pharmacy.ts` | `summaries()`                                               | One `PatientSummary` per patient with a created prescription               |
| `report.ts`   | `compareSummaries(a, b)`                                    | The report order, for sorting                                              |
| `report.ts`   | `formatSummary(summary)`                                    | One report line                                                            |
| `report.ts`   | `formatReport(summaries)`                                   | All report lines in report order                                           |
| `money.ts`    | `Money.dollars`, `zero`, `plus`, `minus`, `times`, `format` | Whole-dollar amounts and their text, such as `-$1`                         |

## Data flow

1. `cli.ts` calls `run` with the arguments and the process's stdin, stdout and stderr.
2. `run` asks `chooseInput` for the file or stdin. A usage error goes to stderr and the exit code is 1.
3. `openInput` opens the input. If it can't be read, the error goes to stderr and the exit code is 1.
4. `run` reads the lines with `readLines`, numbering them from 1, empty lines included.
5. Each line goes through `parseLine`. An empty line is skipped. A rejected line is numbered and written to
   stderr straight away with `describeRejection`, and reading carries on so every rejected line is listed.
6. Each event goes to `Pharmacy.apply`, one at a time, as it is read. When it returns a rejection (a second
   `created`, or a return with no fill to cancel), that line is reported the same way.
7. Once the input ends, if any line was rejected, nothing goes to stdout and the exit code is 1 (S18).
8. Otherwise `Pharmacy.summaries` gives one summary per patient with a created prescription, and `formatReport`
   sorts them with `compareSummaries` and formats each with `formatSummary`. `run` writes the lines to stdout
   and the exit code is 0.

Nothing is held at module level. Each run makes its own `Pharmacy`, so tests and runs never share state.

## Types

| Type                | Module     | Meaning                                                                                               |
| ------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `EventKind`         | `types.ts` | `"created" \| "filled" \| "returned"`, derived from the `EVENT_KINDS` array the parser checks against |
| `PatientName`       | `types.ts` | A patient's name, any text without spaces                                                             |
| `DrugName`          | `types.ts` | A drug's name, any text without spaces                                                                |
| `PrescriptionEvent` | `types.ts` | One event: patient, drug and kind                                                                     |
| `Rejection`         | `types.ts` | Why a line was rejected, with what its message needs (below)                                          |
| `RejectReason`      | `types.ts` | The rejection's code on its own                                                                       |
| `ParseResult`       | `types.ts` | Either a parsed event or a rejection                                                                  |
| `Money`             | `money.ts` | An amount of money in whole US dollars, stored as integer cents                                       |
| `PatientSummary`    | `types.ts` | One patient's name, net fills (fills minus returns) and income                                        |
| `InputSource`       | `input.ts` | A file path, stdin, or a usage error with its message                                                 |
| `Io`                | `app.ts`   | The stdin, stdout and stderr `run` uses                                                               |
| `ExitCode`          | `app.ts`   | 0 or 1 (below)                                                                                        |

Income is $5 for each net fill, minus $1 for each return (`FILL_INCOME` and `RETURN_PENALTY` in `pharmacy.ts`).

### Rejections

| Reason              | Found by         | Carries              | Message                                                                     |
| ------------------- | ---------------- | -------------------- | --------------------------------------------------------------------------- |
| `wrong-field-count` | `parseLine`      | the number of fields | `line 4: expected 3 fields, found 2`                                        |
| `unknown-event`     | `parseLine`      | the word found       | `line 10: unknown event "cancelled" (expected created, filled or returned)` |
| `duplicate-created` | `Pharmacy.apply` | the event            | `line 3: prescription Mark B already created`                               |
| `nothing-to-return` | `Pharmacy.apply` | the event            | `line 2: Mark B returned with no fill to cancel`                            |

## Exit codes

| Code | Meaning                                                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------- |
| 0    | Every line was valid and the report was printed                                                         |
| 1    | No report was printed. A line was rejected, the command was used wrongly, or the input couldn't be read |

One rejected line stops the report (S18): events are applied in the order they happen, so skipping a line would
change the history every later line for that prescription is applied to.

## Still open

- The scaffolding plan's proposed decisions (S3 to S8, S10, S11 and S15) are waiting for Tod's OK.
- Whether readline passes on a stream error for a missing file or a directory on Node 22. If not, `openInput`
  opens the file first.
- Whether a line with an empty field gets its own reason, instead of counting the empty field.
- The exact wording of the usage text and of the error for an unreadable file.
