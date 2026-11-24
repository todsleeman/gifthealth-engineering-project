# Architecture

rx-report reads prescription events, one per line, and prints fills and income per patient. This page maps the
modules, the data flow and the types. The decisions behind them, with the options that were turned down, are in
[plans/architecture.md](plans/architecture.md).

## Modules

| Module            | Responsibility                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `src/cli.ts`      | Reads the arguments, picks the file or stdin, writes the report and warnings, sets the exit code |
| `src/events.ts`   | Parsing one line into an event                                                                   |
| `src/pharmacy.ts` | The spec's rules (created first, fills, returns) and income                                      |
| `src/money.ts`    | `Money`, the only module that uses Dinero.js                                                     |
| `src/report.ts`   | The report's order and line format                                                               |
| `src/types.ts`    | The domain types the core modules share, and the `EVENT_KINDS` list `EventKind` is built from    |

Only `cli.ts` does I/O. Everything else is plain code that takes values and returns values, so the same core
could sit behind an HTTP API.

The domain types the core modules share live in `types.ts`, so the whole data model reads in one file.
`EVENT_KINDS` sits there too, because `EventKind` is built from it. Types for the edge of the program stay with
the code that uses them, so `ExitCode` is in `cli.ts`. That keeps I/O types out of the domain file. `Money` is a
class with its own behaviour, so it stays in `money.ts`.

## Data flow

1. `cli.ts` reads lines from the file named on the command line, or from stdin when there is none.
2. Each line goes through `parseLine`. A rejected line is written to stderr with its line number and reason.
3. Valid events go to the pharmacy rules one at a time, as they are read. Events the spec says can't happen (a
   second `created`, a return with no fill to cancel) are rejected and reported the same way.
4. Once the input ends, the pharmacy rules give one `PatientSummary` per patient with a created prescription.
5. The summaries are sorted with `compareSummaries`, turned into lines with `formatSummary`, and written to
   stdout.
6. The exit code comes from whether any line was rejected.

Nothing is held at module level. Each run builds its state inside a function call, so tests and runs never share
it.

## Types

| Type                | Module     | Meaning                                                                                               |
| ------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `EventKind`         | `types.ts` | `"created" \| "filled" \| "returned"`, derived from the `EVENT_KINDS` array the parser checks against |
| `PatientName`       | `types.ts` | A patient's name, any text without spaces                                                             |
| `DrugName`          | `types.ts` | A drug's name, any text without spaces                                                                |
| `PrescriptionEvent` | `types.ts` | One event: patient, drug and kind                                                                     |
| `RejectReason`      | `types.ts` | Why a line was rejected: wrong field count, unknown event, duplicate created, nothing to return       |
| `ParseResult`       | `types.ts` | Either a parsed event, or the line number and reason it was rejected                                  |
| `Money`             | `money.ts` | An amount of money in whole US dollars, stored as integer cents                                       |
| `PatientSummary`    | `types.ts` | One patient's name, net fills (fills minus returns) and income                                        |
| `ExitCode`          | `cli.ts`   | 0, 1 or 2 (below)                                                                                     |

Income is $5 for each net fill, minus $1 for each return (`FILL_INCOME` and `RETURN_PENALTY` in `pharmacy.ts`).

## Exit codes

| Code | Meaning                                                                            |
| ---- | ---------------------------------------------------------------------------------- |
| 0    | Every line was valid and the report is complete                                    |
| 1    | The report was printed, but some lines were rejected. Each one is listed on stderr |
| 2    | No report was printed. The command was used wrongly or the input couldn't be read  |

## Still open

These are decided in the functionality plan, not here:

- Whether the pharmacy rules are a class or a single function, and how they report a rejected event.
- How a prescription's state is stored inside `pharmacy.ts`.
- Whether reading lines gets its own module.
- The final signatures of the functions that are stubs today.
