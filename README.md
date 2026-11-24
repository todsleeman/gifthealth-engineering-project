# Gifthealth Engineering Project

## Overview

## Problem Summary

## Getting Started

### Requirements

- Node.js 22 or later
- npm

### Installation

```sh
npm ci
```

This installs the development tools and compiles the CLI into `dist/`. If your npm is set to skip install
scripts, build it yourself:

```sh
npm run build
```

### Usage

From the project folder, after installing:

```sh
npx rx-report events.txt
cat events.txt | npx rx-report
```

The report goes to stdout. Any line that couldn't be used is listed on stderr with its line number.

#### Exit codes

| Code | Meaning                                                                                        |
| ---- | ---------------------------------------------------------------------------------------------- |
| 0    | Every line was valid and the report is complete                                                |
| 1    | The report was printed, but some lines were rejected and skipped. Each one is listed on stderr |
| 2    | No report was printed. The command was used wrongly or the input couldn't be read              |

## Running Tests

```sh
npm test
```

To run the type check, lint and tests together:

```sh
npm run check
```

## Project Structure

```
src/
  cli.ts        arguments, file or stdin, stdout and stderr, exit codes
  events.ts     parsing one line into an event
  pharmacy.ts   the spec's rules (created first, fills, returns) and income
  money.ts      Money, the only file that uses Dinero.js
  report.ts     report order and line format
  types.ts      the domain types the core modules share
tests/          mirrors src/
docs/
  architecture.md   module map, data flow and types
  plans/            the plans this was built from, with every decision and who made it
```

## Architecture and Design

The full module map and type list is in [docs/architecture.md](docs/architecture.md). The decisions behind it,
including the options I turned down, are in [docs/plans/architecture.md](docs/plans/architecture.md).

### Data Flow

The CLI reads one line at a time and parses it into an event. A line that can't be used goes to stderr with its
line number. Valid events go through the pharmacy rules as they are read, so the whole file is never held in
memory. When the input ends, the rules give one summary per patient. The report sorts the summaries, formats
them and prints them to stdout. The exit code says whether any line was rejected.

Only the CLI touches files, stdin or stdout. The rest takes values and returns values, which keeps it easy to
test and lets it sit behind an HTTP API later.

### Data Structures

- **Events.** Every event carries the same three fields, so one `PrescriptionEvent` type with a `kind` field is
  enough. The event names are a `const` array and the type is derived from it, so the parser's check and the
  type can't drift apart.
- **Prescriptions.** A prescription is a patient and a drug. The pharmacy rules keep prescriptions grouped by
  patient, so building the report is one pass over each patient's prescriptions.
- **Money.** `Money` is a small class around Dinero.js. It stores integer cents and only works in whole dollars
  today. Keeping money in its own type means it can't be added to a fill count by mistake.
- **Summaries.** Each patient's summary holds their name, net fills and income. The field is `netFills` because
  returns cancel fills, so it isn't the number of fill events.
- **Parse results.** A rejected line comes back as a value with a reason code, not as a thrown error. The CLI
  decides what to do with it and how to word the message.

### Code Organization

Each module owns one part of the problem. `events.ts` knows the input format, `pharmacy.ts` knows the spec's
rules, `report.ts` knows the output format, and `cli.ts` connects them to the terminal. All the spec's business
rules, income included, are in `pharmacy.ts`.

The domain types the core modules share are in `types.ts`, so the whole data model reads in one file. Types for
the edge of the program, like the exit codes, stay with the code that uses them. `Money` is a class with its own
behaviour, so it stays in `money.ts`.

## Assumptions

- **Report order.** The spec doesn't state an order. The sample matches patients sorted by fills, most first,
  with ties broken by name in alphabetical order, so the report uses that.
- **Income format.** Prices are whole dollars ($5 per fill, $1 per return), so all income is a whole number of
  dollars and prints without decimals ($9, -$1, $0). A negative amount puts the minus sign before the dollar
  sign, as in the sample.
- **Fill count wording.** A count of one prints as "1 fill" and every other count as "fills". The sample never
  shows a count of one, so this is chosen for readability.
- **A prescription is a patient and a drug.** The input has no prescription number, so Mark B is one
  prescription. The spec says a prescription can be filled many times and won't be created twice, so a second
  created for the same patient and drug is rejected and reported like a malformed line.
- **Who appears in the report.** A patient is listed only if at least one of their prescriptions was created.
  Paul's only event is a fill with no created, so he is missing from the sample output. Nick was created but
  never filled, so he shows zeros.
- **Returns.** A return cancels one fill and costs $1. Mark has three fill events and one return in the sample,
  which gives 2 fills and $9.
- **A return needs a fill to cancel.** The spec says a return cancels a prior fill and always has one. A return
  is only applied if the prescription has a fill that hasn't already been cancelled. A return with nothing to
  cancel is rejected and reported like a malformed line, with no fill cancelled and no $1 charged. This covers a
  return with no fill at all, a second return for a single fill, and a return whose only fill was discarded
  because it came before created.
- **Events before created.** Fills and returns before created are discarded for good. A later created starts the
  prescription from zero.
- **Names.** Patient and drug names can be any text without spaces. The sample's single letters read as
  placeholders. Names and event names match exactly, including case, so mark and Mark are different patients
  and Filled is an unknown event.
- **Line format.** Fields are separated by single spaces, as the spec describes the file as space-delimited. A
  line with extra spaces, a leading or trailing space, or more or fewer than three fields is malformed. Empty
  lines are skipped because they hold no event.
- **Input source.** If a filename is given, the program reads that file and ignores stdin. Otherwise it reads
  stdin.
- **Malformed lines.** The spec doesn't cover them. A line with the wrong number of fields or an unknown event is
  skipped and reported, following the spec's own rule of discarding fills and returns before created. See Error
  Handling and Edge Cases.

## Design Tradeoffs

### Design

- **Dinero.js for money instead of a hand-written class**
  - Today the report only adds and multiplies whole dollars, so a small class would be enough.
  - Dinero.js stores money as integer cents with immutable values, so supporting prices with cents later is a
    change to money.ts only.
  - The cost is one runtime dependency to keep updated. It has no dependencies of its own.
  - Only money.ts imports it, so replacing it later would touch one file.
- **Income rules live with the pharmacy rules**
  - The $5 per fill and $1 per return sit in pharmacy.ts next to the rules about created, filled and returned,
    so every rule from the spec is in one module.
  - Pricing that varies (per drug, from config) would be better as its own module that turns fills and returns
    into money. With one fixed price per event, that module would only hold two constants.
- **One file for the domain types**
  - The types the core modules share (events, reject reasons, summaries) are in types.ts, so the data model
    reads in one place.
  - Types for the edge of the program stay with the code that uses them, so the exit codes are in cli.ts. This
    keeps I/O types out of the domain file, so the core still has no I/O.
  - The cost is that some types sit away from the code that uses them most, such as the reject reasons and the
    parser. If the model grows large, types.ts would split into one file per area, such as events and summaries.
  - It is a .ts file rather than a .d.ts. TypeScript is set to skip checking .d.ts files (skipLibCheck), so a
    mistake in one would go unnoticed. A .d.ts also can't hold the `EVENT_KINDS` list that `EventKind` is built
    from.

### Tooling

- Compiled to JavaScript rather than run as TypeScript
  - Runs on Node 22 (current oldest LTS) with nothing extra installed. Running .ts directly needs Node 23.6 or tsx.
  - Enforces a type check before the CLI can run.
  - TypeScript is set to Node 22, so it flags anything Node 22 doesn't have.
- `npm ci` instead of `npm install`
  - Installs the exact versions in package-lock.json, so a reviewer gets what I tested.
  - Also builds dist/ through prepare. If install scripts are turned off, run npm run build.

## Testing Strategy

## Error Handling and Edge Cases

A malformed line is skipped and the rest of the file is still processed. Each skipped line is written to stderr
with its line number and the reason, so stdout only ever holds the report and can be piped or saved safely.
Lines the spec says can't happen (a second created, or a return with no fill to cancel) are handled the same
way.

A skipped line might belong to a patient, so their fills and income could be wrong. The report is still printed,
but the command exits with 1 instead of 0. A script that runs the report and then uses it (for example with
`&&`) stops, unless it chooses to accept a partial report.

Here is the spec's sample with two bad lines added, `Mark B` at line 4 and `John E cancelled` at line 10.

```
$ npx rx-report events.txt
line 4: expected 3 fields, found 2
line 10: unknown event "cancelled" (expected created, filled or returned)
Mark: 2 fills $9 income
John: 0 fills -$1 income
Nick: 0 fills $0 income
$ echo $?
1
```

The input itself can also be a problem.

- An empty file prints nothing and exits 0.
- A missing or unreadable file, or a directory, prints an error to stderr and exits 2.
- Running with no filename and nothing piped in prints usage and exits 2, instead of waiting for input.

## Future Improvements

- **HTTP API.** The core logic is separate from the CLI, so it could sit behind an HTTP API without changes.
- **Drug catalog.** Drug names are accepted as free text because the report only counts fills and income, and
  nothing in it depends on which drug was filled. A real pharmacy would check each drug against a catalog of
  drug codes (in the US, NDC codes). That catalog would be data passed to the parser, so adding a drug wouldn't
  need a code change. Per-drug pricing would be the first change that needs the logic to know which drug it is.
- **Patient and prescription IDs.** Patients are identified by name and prescriptions by patient and drug,
  because that is all the input carries. Two patients with the same name would be merged, and a new
  prescription for the same drug (for example after the refills run out) can't be told apart from the old one.
  A real system would key events on a patient ID and a prescription number.
- **Prices with cents or another currency.** Prices are whole US dollars today. Money is stored in cents through
  Dinero.js, so a price like $4.50 or a second currency is a change inside money.ts, plus a decision on how the
  report prints it.
- **Sort option.** The report order is fixed (fills, then name). A flag such as `--sort income` would let a
  reader choose. It would be the first option the CLI takes, and the point to reconsider a small argument parser
  instead of reading process.argv by hand.
- **State across runs.** Each run starts with no history, so the input must hold every event from each
  prescription's creation onwards. If events arrived in daily files, a prescription created yesterday and filled
  today would have today's fill discarded. A small database such as SQLite would keep prescriptions between
  runs, and it would sit naturally behind the HTTP API.
