# Gifthealth Engineering Project

## Overview

`rx-report` is a command-line tool that reads a pharmacy's prescription events and prints, for each patient, how
many fills they have and how much income those fills brought in. It is written in TypeScript and runs on Node.js
22 or later. It reads the file named on the command line, or stdin if no file is given.

The brief asks for production-quality code on a small problem, so most of the effort went into keeping the rules
in one place, testing each one, and writing down every choice the spec leaves open. This README covers how to
run it, how the code is organized and why, the assumptions I made, and what I would change next.

## Problem Summary

The input has one event per line, in the order the events happened. Each line has three fields separated by
spaces, the patient's name, the drug's name and the event. There are three events.

- **created.** The prescription now exists. Fills and returns that came before it are discarded.
- **filled.** The prescription was filled. It can be filled any number of times, and each fill earns $5.
- **returned.** An earlier fill was returned. The return cancels that fill, so its $5 no longer counts, and it
  costs a further $1. The $1 stays lost even if the prescription is filled again later.

The report prints one line per patient with their total fills and total income. Here is the spec's sample.

```
Nick A created
Mark B created
Mark B filled
Mark C filled
Mark B returned
John E created
Mark B filled
Mark B filled
Paul D filled
John E filled
John E returned
```

It produces this report.

```
Mark: 2 fills $9 income
John: 0 fills -$1 income
Nick: 0 fills $0 income
```

Mark's prescription C was never created, so its fill is discarded. Prescription B has three fills and one return,
which leaves 2 fills worth $10, less $1 for the return. Paul's only event is a fill with no created, so he isn't
in the report at all. Nick was created but never filled, so he shows zeros.

The spec leaves several things open, including the order of the report, what identifies a prescription when the
input has no prescription number, and what to do with a line that doesn't fit the format. The choices I made are
in [Assumptions](#assumptions), and the handling of bad input is in
[Error Handling and Edge Cases](#error-handling-and-edge-cases).

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

The report goes to stdout. If a line can't be used, it is reported on stderr with its line number, reading stops
and no report is printed.

#### Exit codes

| Code | Meaning                                                                                                                          |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Every line was valid and the report was printed                                                                                  |
| 1    | No report was printed. A line was rejected, the command was used wrongly, or the input couldn't be read. The reason is on stderr |

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
  cli.ts          the entry point, which hands the arguments and streams to run
  app.ts          run, which connects the modules, writes output and picks the exit code
  types.ts        the domain types the core modules share
  pharmacy.ts     the spec's rules (created first, fills, returns) and income
  helpers/        what the program and the rules lean on
    input.ts      choosing the file or stdin, opening it and reading it line by line
    events.ts     parsing one line into an event
    report.ts     report order and line format
    money.ts      Money, the only file that uses Dinero.js
tests/          mirrors src/, plus cli.test.ts for the built CLI
  fixtures/     the spec's sample, its expected output and the two-error example below
  global-setup.ts   builds dist/ once before the tests run
docs/
  architecture.md   module map, data flow and types
  plans/            the plans this was built from, with every decision and who made it
```

## Architecture and Design

The full module map, function list and type list is in [docs/architecture.md](docs/architecture.md). The
decisions behind it, including the options I turned down, are in
[docs/plans/architecture.md](docs/plans/architecture.md) and [docs/plans/scaffolding.md](docs/plans/scaffolding.md).

### Data Flow

The app reads one line at a time, numbers it and parses it into an event. A line that can't be used goes to
stderr with its line number. Valid events go through the pharmacy rules as they are read, so the whole file is
never held in memory. The pharmacy rules hand back a rejection for an event the spec says can't happen, and that
line is reported the same way. The first rejected line stops the run: nothing goes to stdout and the exit code
is 1. When the input ends with no line rejected, the rules give one summary per patient, and the report sorts
the summaries, formats them and prints them to stdout.

Only the app and input modules touch files, stdin or stdout, and the app gets its streams passed in. The rest
takes values and returns values, which keeps it easy to test and lets it sit behind an HTTP API later.

### Data Structures

- **Events.** Every event carries the same three fields, so one `PrescriptionEvent` type with a `kind` field is
  enough. The event names are a `const` array and the type is derived from it, so the parser's check and the
  type can't drift apart.
- **Prescriptions.** A prescription is a patient and a drug. The pharmacy rules keep prescriptions grouped by
  patient, so building the report is one pass over each patient's prescriptions. Each prescription stores only
  its fill and return counts (see Design Tradeoffs). Events before created are never stored, so only created
  prescriptions reach the report.
- **Money.** `Money` is a small class around Dinero.js. It stores integer cents and only works in whole dollars
  today. Keeping money in its own type means it can't be added to a fill count by mistake.
- **Summaries.** Each patient's summary holds their name, net fills and income. The field is `netFills` because
  returns cancel fills, so it isn't the number of fill events.
- **Rejections.** A rejected line comes back as a value, not as a thrown error, from both the parser and the
  pharmacy rules. Each one carries what its message needs, such as the field count or the word that wasn't an
  event. `run` decides what to do with it and how to word the message.

### Code Organization

Each module owns one part of the problem (see Project Structure), and all the spec's business rules, income
included, are in `pharmacy.ts`. The top of `src/` is the program itself: how it starts, how it is wired, its data
model and its rules. Everything those lean on is one folder down in `helpers/`. `cli.ts` only starts `run` with the
real process streams. Keeping `run` in its own module means tests can import it and call it with fake streams,
which they couldn't do if importing it started the CLI.

## Assumptions

- **Report order.** The spec doesn't state an order. The sample matches patients sorted by fills, most first,
  with ties broken by name in alphabetical order, so the report uses that. Names are compared in English
  alphabetical order on every machine, so adam comes before Zed and mark comes just before Mark.
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
- **A return needs a fill to cancel.** The spec says a return cancels a prior fill and always has one. A return
  is only applied if the prescription has a fill that hasn't already been cancelled. A return with nothing to
  cancel is rejected and reported like a malformed line, with no fill cancelled and no $1 charged. This covers a
  return with no fill at all, a second return for a single fill, and a return whose only fill came before
  created.
- **Events before created.** The spec says fills and returns before created must be discarded, so they are
  treated as if they never happened. A later created starts the prescription from zero, and a return after it
  can only cancel a fill made after it.
- **Names.** Patient and drug names can be any text without spaces. The sample's single letters read as
  placeholders. Names and event names match exactly, including case, so mark and Mark are different patients
  and Filled is an unknown event.
- **Line format.** Fields are separated by single spaces, as the spec describes the file as space-delimited. A
  line with extra spaces, a leading or trailing space, or more or fewer than three fields is malformed. Empty
  lines are skipped because they hold no event. Extra spaces make empty fields, which count as fields, so `Mark  B filled`
  is reported as 4 fields. Windows line endings (`\r\n`) work, and a byte order mark at the start of the file,
  which some Windows editors add, is dropped so it doesn't become part of the first name.
- **Input source.** If a filename is given, the program reads that file and ignores stdin. Otherwise it reads
  stdin. The one argument is always a filename, so `-` and `--help` are read as files named `-` and `--help`.
  The program takes no options, and a missing file prints the usual error.
- **One bad line is an error.** Events are applied in the order they happen, so skipping a line would change the
  history every later line is applied to. A line that can't be used (the wrong number of fields, an unknown event,
  a second created, or a return with nothing to cancel) is reported on stderr, reading stops, no report is
  printed, and the command exits with 1. The reasoning is under Design Tradeoffs.

## Design Tradeoffs

### Design

- **Dinero.js for money instead of a hand-written class**
  - Money is where hand-written code tends to go wrong (floating-point cents, rounding, mixed currencies), so I
    use a tested library for it by default, even when today's sums are simple.
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
- **A Pharmacy class for the rules' state**
  - The rules need state that lasts the whole run: a return on line 9 depends on fills on lines 3 and 7. A
    Pharmacy object holds that state privately, and apply is the only way to change it, so nothing can break
    the rules' facts (a prescription exists only after created, returns never exceed fills).
  - Each run makes a new Pharmacy, so runs and tests never share state.
  - Plain functions with the state passed around would work too, but anything holding the state could change
    it without going through the rules. A single function over all the events would need the whole file in
    memory before it could start.
  - The cost is that it holds changing state, so a test applies a few events and then checks the summaries,
    rather than comparing one value in and one value out.
- **Counts per prescription instead of a list of events**
  - Each prescription keeps two numbers, its fills and its returns. Net fills, income and whether a return is
    allowed are all worked out from them, so nothing is stored twice.
  - Memory grows with the number of prescriptions, not the number of lines, so a long file costs no more than a
    short one with the same patients.
  - The cost is that the counts forget the history: which fill a return cancelled, or when. A rule that depends
    on order or dates, such as a $1 penalty only for returns within 30 days, can't be run on them.
  - The input file already holds the full history in order, so a new rule means running the new code over the
    file again. If prescriptions were kept between runs (see Future Improvements), the events would need storing
    too, with the counts built from them.
- **One file for the domain types**
  - The types the core modules share (events, reject reasons, summaries) are in types.ts, so the data model
    reads in one place.
  - Types for the edge of the program stay with the code that uses them, so the exit codes and streams are in
    app.ts and the input source is in input.ts. This keeps I/O types out of the domain file, so the core still
    has no I/O.
  - The cost is that some types sit away from the code that uses them most, such as the reject reasons and the
    parser. If the model grows large, types.ts would split into one file per area, such as events and summaries.
  - It is a .ts file rather than a .d.ts. TypeScript is set to skip checking .d.ts files (skipLibCheck), so a
    mistake in one would go unnoticed. A .d.ts also can't hold the `EVENT_KINDS` list that `EventKind` is built
    from.

- **Stop with no report at the first rejected line**
  - Events are applied in the order they happen, so a skipped line changes what every later line for that
    prescription means, and a line with the wrong number of fields can't even say which patient it belonged to.
    A report with wrong income that looks right is worse than none.
  - After a rejected line the rules' state no longer matches what happened, so checking later lines could
    report errors on lines that are fine. Stopping at the first one means every message is a real error, and the
    rule is easy to state and test.
  - The cost is that a bad line blocks the report, and a file with several takes one run per bad line to fix.
  - I also considered skipping bad lines and printing the report anyway, and stopping the rules but parsing the
    rest of the file to list every malformed line at once. The first can print wrong totals, and the second is
    harder to explain.

### Tooling

- Compiled to JavaScript rather than run as TypeScript
  - Runs on Node 22 (current oldest LTS) with nothing extra installed. Running .ts directly needs Node 23.6 or tsx.
  - Enforces a type check before the CLI can run.
  - TypeScript is set to Node 22, so it flags anything Node 22 doesn't have.
- `npm ci` instead of `npm install`
  - Installs the exact versions in package-lock.json, so a reviewer gets what I tested.
  - Also builds dist/ through prepare. If install scripts are turned off, run npm run build.

## Testing Strategy

Tests are written before the code they check, and each one is named after the spec rule or assumption it
covers. They started as a list of `it.todo` entries, one per rule, so the list doubles as a checklist of the spec.

There are three levels.

- **Unit tests per module.** Parsing, money, the pharmacy rules, the report format and choosing the input are
  each tested on their own with plain values. This is where most of the spec's rules are checked.
- **Tests of `run` with fake streams.** These check the pieces together in the same process. They cover what
  goes to stdout and stderr, the line numbers in error messages, and the exit codes, without starting a real process.
- **Acceptance tests on the built CLI.** These run `dist/cli.js` as a child process with the spec's sample,
  once as a file argument and once through stdin, and compare stdout with the expected output byte for byte.
  They also run the two-error example below and a missing file. Vitest builds `dist/` once before any test
  runs, so these never test a stale build. The inputs and the expected output are files in `tests/fixtures/`.

## Error Handling and Edge Cases

The first line that can't be used is written to stderr with its line number and the reason, reading stops, and
nothing is written to stdout. Lines the spec says can't happen (a second created, or a return with no fill to
cancel) are handled the same way. Why is under Design Tradeoffs.

Here is the spec's sample with two bad lines added, `Mark B` at line 4 and `John E cancelled` at line 10. Only
line 4 is reported. Fixing it and running again reports line 10.

```
$ npx rx-report events.txt
line 4: expected 3 fields, found 2
$ echo $?
1
```

The input itself can also be a problem.

- An empty file prints nothing and exits 0.
- A missing or unreadable file, or a directory, prints Node's error to stderr and exits 1, for example
  `rx-report: ENOENT: no such file or directory, open 'events.txt'`.
- Running with no filename and nothing piped in prints what was wrong and the usage, and exits 1, instead of
  waiting for input. More than one filename is handled the same way.

```
$ npx rx-report
rx-report: no file given and stdin is a terminal
usage: rx-report [file]
Reads prescription events from file, or from stdin if no file is given.
```

## AI Usage

I built this with Claude Code as a pair programmer. The agent wrote most of the code, the tests and the first
drafts of the docs. I decided what to build, made the calls the spec leaves open, and reviewed every change before
it merged. My name is on every line, so I wanted to understand all of it before it went in.

The work went in five steps, in this order. Each step had a written plan that I agreed before the agent started,
and each plan's decision table says who made each call, me or the agent with my approval. The plans are in
[docs/plans/](docs/plans/), and [AGENTS.md](AGENTS.md) is the standing brief the agent worked from.

- **Infrastructure.** The toolchain came before any app code, so the first line of logic was already type-checked,
  linted and tested. I chose Vitest over Jest, and pinned the type check to Node 22 even though I develop on 25. The
  agent proved the pin with a probe file (`RegExp.escape`, from ES2025, fails the type check and
  `Object.groupBy`, from ES2024, passes).
- **Architecture.** Modules, types and the open questions in the spec. This is where I overruled the agent most. It
  proposed a hand-written money class, splitting on any run of whitespace, always printing "fills" and always
  exiting 0. I chose Dinero.js, strict single spaces, "1 fill" and a failing exit code for bad input. The
  challenge went both ways. I proposed a `types.d.ts` for the shared types, and the agent pointed out that
  `skipLibCheck` would leave it unchecked, so it is `types.ts`. The options I turned down are kept in the plan.
- **Scaffolding.** Every function as a stub with its TSDoc contract, and every test as an `it.todo` named after the
  rule it checks (98 of them). The agent marked its own answers to the open questions as proposals, and I
  reviewed each one before merging. I changed five, and added the rule that one bad line stops the report.
- **Testing.** The acceptance tests on the built CLI went in first and stayed red until `run` was built. Each
  module's tests were run and seen to fail before the module was written. The tests are the spec in a form the
  agent can't talk its way around.
- **Functionality.** The agent built one module at a time against the tests. A second agent, with none of the
  first session's context, then reviewed the pull request against the spec and this README. It found real bugs,
  such as a byte order mark at the start of a file becoming part of the first patient's name. A last review asked
  only what could be removed, and I took out two unused money methods and a platform-specific error handler.

Some things I kept for myself. Every rule in [Assumptions](#assumptions) is my reading of the spec, and where the
agent and I read it differently, my reading is what the tests check. The README is in my words. The agent drafted
parts of it, and I rewrote or cut what didn't sound like me or repeated another section.

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
- **Prices with cents or another currency.** Prices are whole US dollars today, but money is already stored in
  cents through Dinero.js, so a price like $4.56 changes only money.ts. `Money.dollars` would accept up to two
  decimal places and round to whole cents, which also corrects floating-point error (in JavaScript, 4.56 × 100
  is 455.99999999999994), and `format` would print the cents. A second currency is a change there too, plus a
  decision on how the report prints it.
- **Sort option.** The report order is fixed (fills, then name). A flag such as `--sort income` would let a
  reader choose. It would be the first option the CLI takes, and the point to reconsider a small argument parser
  instead of reading process.argv by hand.
- **Skipping bad lines on request.** A flag such as `--skip-invalid` could print the report anyway, for a reader
  who accepts that some totals may be wrong. It would need a clear note on stderr that the report is incomplete.
- **State across runs.** Each run starts with no history, so the input must hold every event from each
  prescription's creation onwards. If events arrived in daily files, a prescription created yesterday and filled
  today would have today's fill discarded. A small database such as SQLite would keep prescriptions between
  runs, and it would sit naturally behind the HTTP API.
