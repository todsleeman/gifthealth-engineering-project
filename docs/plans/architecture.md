# Architecture plan: module skeleton, types and recorded decisions for rx-report

## Context

The toolchain is in place (`docs/plans/infrastructure.md`), but `src/` holds only an empty `cli.ts`. Tod and the
agent discussed the architecture on 2026-11-24 before any feature code: the types, the module boundaries,
the money model, the error and exit-code behaviour, and how to read the parts of the spec it leaves open.

This plan records those decisions, builds a **skeleton** (real exported types and stub signatures, no
behaviour), installs the one runtime dependency, and writes the decisions into the README, `docs/` and
AGENTS.md. The behaviour itself is the next plan (the functionality plan), written test-first against these
stubs. That plan opens with the spec-sample acceptance test.

The skeleton is deliberately loose where the discussion left things open (see "Deferred"): it fixes only
what was agreed.

## Decisions made

"(Tod)" marks a decision Tod made, including where he chose differently from the agent's recommendation.
Spec quotes are from `Gifthealth Engineering Project.md`.

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                  | Why                                                                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Modules: `cli.ts` (argv, input source, stdout/stderr, exit codes), `events.ts` (line parsing), `types.ts` (the domain types, A24), `money.ts` (Money), `pharmacy.ts` (the spec's rules and income), `report.ts` (order and output format)                                                                                                                                 | Core logic has no I/O, so it can sit behind an HTTP API later; the CLI only wires I/O                                                                                                                                                                                              |
| A2  | `EVENT_KINDS = [...] as const` and `EventKind` derived from it (Tod)                                                                                                                                                                                                                                                                                                      | The parser's runtime check and the type come from one list and can't drift apart. Tod chose this over a hand-written union after discussion                                                                                                                                        |
| A3  | `PatientName` and `DrugName` are `string` aliases; no fixed drug list (Tod)                                                                                                                                                                                                                                                                                               | Nothing in the report depends on which drug it is; reviewers' own input may use other names. Tod first proposed a fixed A–E list, then agreed. Catalog and IDs are Future Improvements                                                                                             |
| A4  | One `PrescriptionEvent` interface with a `kind` field, handled by `switch` with a `never` exhaustiveness check                                                                                                                                                                                                                                                            | All three kinds carry the same data, so a union of three object types adds nothing                                                                                                                                                                                                 |
| A5  | Parse errors are values (`ParseResult`), with reasons as a code union (`RejectReason`) (Tod)                                                                                                                                                                                                                                                                              | The parser reports, the CLI decides policy and wording; tests check codes, not message text                                                                                                                                                                                        |
| A6  | Money is a `Money` class wrapping **Dinero.js 2.0.2**; only `money.ts` imports Dinero (Tod)                                                                                                                                                                                                                                                                               | Tod chose a library over the agent's hand-written class ("set and forget"). The wrapper keeps cents and currency in one place and makes the library a one-file swap                                                                                                                |
| A7  | Whole US dollars only: `Money.dollars(n)` rejects non-integers; `format()` prints `$9`, `-$1`, `$0`, no cents branch (Tod)                                                                                                                                                                                                                                                | Prices are constants in the code ($5, $1) and the input carries no money. Cents would be a code change, and its format can be decided then                                                                                                                                         |
| A8  | Income rules live in `pharmacy.ts`: `FILL_INCOME = $5`, `RETURN_PENALTY = $1`, income = 5 × net fills − 1 × returns                                                                                                                                                                                                                                                       | All of the spec's rules sit in one module; `report.ts` only orders and prints                                                                                                                                                                                                      |
| A9  | `PatientSummary { patient, netFills, income: Money }`; printed as "fills" (Tod)                                                                                                                                                                                                                                                                                           | The name says returns are already subtracted (Mark: 3 fill events, 2 fills)                                                                                                                                                                                                        |
| A10 | Report order: net fills descending, then name ascending (Tod)                                                                                                                                                                                                                                                                                                             | Spec states no order; this matches the sample. A stable sort on fills alone gives Mark, Nick, John, so the name tie-break is explicit                                                                                                                                              |
| A11 | Line format `Name: N fills $X income`; a count of one prints `1 fill` (Tod)                                                                                                                                                                                                                                                                                               | Matches the sample; Tod chose readable singular over the agent's "always fills"                                                                                                                                                                                                    |
| A12 | Fields split on single spaces; extra, leading or trailing spaces make a line malformed; empty lines skipped silently (Tod)                                                                                                                                                                                                                                                | Spec: "space-delimited". Tod chose strict over the agent's runs-of-whitespace proposal. CRLF needs no handling (Node's readline treats `\r\n` as one line end)                                                                                                                     |
| A13 | Names and event names match exactly, case included (Tod)                                                                                                                                                                                                                                                                                                                  | Spec says nothing; folding case could merge different patients                                                                                                                                                                                                                     |
| A14 | A filename argument is read and stdin ignored; otherwise stdin. No argument with stdin a terminal prints usage                                                                                                                                                                                                                                                            | Spec: "via a filename argument ... or via stdin"; same as `cat`/`grep`                                                                                                                                                                                                             |
| A15 | **Superseded by S18 (Tod, 2026-11-25): one rejected line stops the report, exit codes 0 and 1.** A rejected line is skipped, listed on stderr with its line number and reason, and processing continues                                                                                                                                                                   | Spec's own invalid-event rule is discard-and-continue ("must be discarded"); stdout holds only the report                                                                                                                                                                          |
| A16 | A second `created` for a prescription is rejected (A15) (Tod)                                                                                                                                                                                                                                                                                                             | Spec: "Multiple `created` events will not show up" and "can be `filled` multiple times", so within the spec a second `created` can only be broken input. Resetting would lose a valid fill                                                                                         |
| A17 | **Third case (a return whose only fill was discarded) replaced by S24.** A return is applied only if the prescription has a fill not yet cancelled (net fills > 0); otherwise rejected (A15), no $1 charged (Tod)                                                                                                                                                         | Spec: a return "cancels out a prior `filled` event". Covers no fill ever, a second return for one fill, and a return whose only fill was discarded                                                                                                                                 |
| A18 | **Superseded by S18 (Tod, 2026-11-25): one rejected line stops the report, exit codes 0 and 1.** Exit codes 0 = report complete, 1 = report printed but lines rejected, 2 = no report (usage error, unreadable input) (Tod)                                                                                                                                               | The `grep`/`diff` pattern. A rejected line may change a patient's totals, so the spec's goal ("a line for every patient, the total number of fills ... and the total income") isn't met for sure                                                                                   |
| A19 | Exit code set with `process.exitCode`, never `process.exit()`                                                                                                                                                                                                                                                                                                             | `exit()` can cut off stdout before a piped report finishes writing                                                                                                                                                                                                                 |
| A20 | Command name `rx-report` (Tod)                                                                                                                                                                                                                                                                                                                                            | Short to type; the agent had recommended keeping `prescription-report`                                                                                                                                                                                                             |
| A21 | Amends I9: no _unnecessary_ runtime dependencies; each needs Tod's OK and a README reason (Tod)                                                                                                                                                                                                                                                                           | Dinero.js is the one approved runtime dependency                                                                                                                                                                                                                                   |
| A22 | No state at module level; events are processed as a stream, one at a time                                                                                                                                                                                                                                                                                                 | Shared state would leak between tests and calls; memory grows with prescriptions, not lines                                                                                                                                                                                        |
| A23 | Agents write README reasoning sections in Tod's plain style; Tod reviews later, no draft markers. AGENTS.md gets no README rule in its place (Tod)                                                                                                                                                                                                                        | Replaces "README reasoning sections are Tod's writing: suggest, don't write", which is removed from AGENTS.md                                                                                                                                                                      |
| A24 | One `src/types.ts` holds the domain types the core modules share (`EVENT_KINDS` with `EventKind`, `PatientName`, `DrugName`, `PrescriptionEvent`, `RejectReason`, `ParseResult`, `PatientSummary`), and each module imports them from there. Types for the I/O edge stay with the code that uses them (`ExitCode` in `cli.ts`). `Money` stays a class in `money.ts` (Tod) | Tod chose one file for the data model over types beside their modules. It is `.ts`, not the `.d.ts` Tod first proposed: `skipLibCheck` skips type-checking `.d.ts` files, and a `.d.ts` can't hold the `EVENT_KINDS` value. Edge types stay out so the domain file has no I/O (A1) |

### Rejected options (kept so the reasoning shows)

- Fixed drug list (A–E) as a type: rejects real input; nothing branches on drug.
- Requiring a "create patient" step: changes the spec's fixed line format.
- Hand-written union for `EventKind`, or a `Record<EventKind, true>` check: Tod preferred the `as const` array.
- Types beside the module that owns them: Tod preferred one file for the data model (A24).
- `types.d.ts` for the shared types: unchecked under `skipLibCheck`, and it can't hold `EVENT_KINDS` (A24).
- Every type in `types.ts`, `ExitCode` included: edge types would put I/O into the domain file (A24).
- Hand-written `Money` class, or Dinero types used directly in the domain: see A6.
- Cents support now: see A7.
- Always printing "fills", lenient whitespace splitting, always exit 0: Tod chose otherwise (A11, A12, A18).
- Resetting a prescription on a second `created`; charging $1 or applying a return with nothing to cancel.
- Trusting the spec's guarantees with no handling: broken input would give impossible numbers silently.
- `-` as "read stdin", a `2 lines skipped` summary on stderr: not needed now.

### Deferred to the functionality plan

- Whether the pharmacy rules sit in a `Pharmacy` class or behind one `summarise(events)` function, and how
  they report a rejected line (A16, A17) back to the CLI.
- The internal shape of a prescription's state (likely `{ fills, returns }` counts; not exported).
- Whether reading lines gets its own `input.ts`.
- Final signatures of the stubbed functions: the functionality plan may change them.
- The spec-sample acceptance test (built CLI as a child process, file argument and stdin, byte for byte).
- At submission: whether the zip ships git history.

## Implementation steps (for the agent; Tod monitors)

0. **Memory.** In the project memory directory, delete `output-order-undecided.md` and its `MEMORY.md` line
   (settled, A10). In `deferred-work.md`, remove the command-name item (settled, A20) and update its
   `MEMORY.md` hook.
1. **Branch.** `git switch -c architecture` from `master` (Tod, 2026-11-24). All commits in this plan go on this
   branch; never push, and leave merging to Tod. Then copy this plan to `docs/plans/architecture.md`. Commit:
   `docs(plans): add architecture plan`.
2. **Install Dinero.js** (Tod approved 2026-11-24): `npm install --save-exact dinero.js@2.0.2`. Then read
   `node_modules/dinero.js/dist/esm/index.d.ts` and `.../currencies/index.d.ts` and note in this plan: the name of
   the value type (expected `Dinero<number>`), how to create one (expected `dinero({ amount, currency })`), the
   add / subtract / multiply functions, how to read the amount back (expected `toSnapshot`), and the `USD`
   export. Don't stop if any of these differs (Tod: run to completion): use what the installed types actually
   provide in step 4, keep the `Money` public API from A6/A7 unchanged, and record every difference in the
   Outcome (step 8). Commit: `chore(deps): add dinero.js`.
3. **Rename the command.** In `package.json` set `name` and the `bin` key to `rx-report`; run `npm install` so
   `package-lock.json` follows. Check `npx rx-report < /dev/null` runs and exits 0. Commit:
   `chore(cli): rename command to rx-report`.
4. **Skeleton.** Exported types and stubs only; every stub body is `throw new Error("not implemented")`. Stub
   parameters start with `_` (renamed when implemented); add `argsIgnorePattern: "^_"` to
   `@typescript-eslint/no-unused-vars` in `eslint.config.js` if lint flags them. No tests yet (the functionality
   plan writes each test first, against these stubs).
   - `src/types.ts` (A24): `EVENT_KINDS`, `EventKind`, `PatientName`, `DrugName`, `PrescriptionEvent` (readonly
     fields `patient`, `drug`, `kind`), `RejectReason = "wrong-field-count" | "unknown-event" |
"duplicate-created" | "nothing-to-return"`, `ParseResult` (`{ ok: true; event }` or `{ ok: false;
lineNumber; reason: RejectReason }`, readonly), `PatientSummary` (readonly `patient`, `netFills`,
     `income: Money`, with `Money` imported as a type).
   - `src/events.ts`: stub `parseLine(_line: string, _lineNumber: number): ParseResult`.
   - `src/money.ts`: `class Money` with a private constructor holding the Dinero value; stubs `static zero`
     (a getter if a static field can't be stubbed), `static dollars(_amount)`, `plus`, `minus`, `times(_count)`,
     `format()`.
   - `src/pharmacy.ts`: `FILL_INCOME` and `RETURN_PENALTY` only (module-private). Nothing else: its entry point
     is deferred.
   - `src/report.ts`: stubs `compareSummaries(_a, _b): number` and `formatSummary(_summary): string`.
   - `src/cli.ts`: add `ExitCode = { Success: 0, LinesRejected: 1, NoReport: 2 } as const` and
     `type ExitCode = (typeof ExitCode)[keyof typeof ExitCode]`; `main` stays empty.
     Check `npm run typecheck` and `npm run lint` are clean and that only `money.ts` imports `dinero.js`.
     Commit: `chore(src): add module skeleton`.
5. **`docs/architecture.md`.** Module map (A1), data flow (lines → `parseLine` → rejected lines to stderr →
   events into the pharmacy rules → summaries → sort → format → stdout, exit code from the rejected count),
   the exported types with one line each, the exit codes, and a "Deferred" list pointing to this plan.
   Commit: `docs(architecture): add module map and data flow`.
6. **README.** Write in Tod's plain style (AGENTS.md A23; no em dashes, colons or semicolons in sentences, short
   plain sentences). Tod reviews later, so don't wait. Use the agreed text in the appendix. Sections:
   Usage (`npx rx-report events.txt`, `cat events.txt | npx rx-report`, exit code table), Project Structure (file
   tree with one line per module), Architecture and Design (Data Flow, Data Structures, Code Organization:
   short summaries linking to `docs/architecture.md`, including the `netFills` sentence), Assumptions, a new
   "Design" heading under Design Tradeoffs (the appendix's two bullets, plus one on the domain types file, A24), Error Handling and Edge Cases, Future Improvements. Leave Overview,
   Problem Summary and Testing Strategy for the functionality plan. Commits: `docs(readme): add usage and exit
codes`, `docs(readme): record architecture and assumptions`.
7. **AGENTS.md and the infrastructure plan.** AGENTS.md: Run command becomes `npx rx-report <file>` (or
   `node dist/cli.js`); Toolchain "No runtime dependencies" becomes "No unnecessary runtime dependencies: each
   needs Tod's OK and a README reason. The only one is dinero.js, imported only by `src/money.ts`"; add an
   "Architecture" section pointing to `docs/architecture.md` and `docs/plans/architecture.md` with A6, A10, A15,
   A18 and A24 in one line each; remove the README rule (A23). In `docs/plans/infrastructure.md`, add under I9:
   "Amended by architecture plan A21 (2026-11-24): no unnecessary runtime dependencies; dinero.js approved."
   Commits: `docs(agents): record architecture decisions`, `docs(plans): amend no-runtime-dependency decision`.
8. **Close the plan.** Add an "Outcome" section to `docs/plans/architecture.md`: what was done, the Dinero API
   notes from step 2, changes from the plan, and what is still deferred. Commit:
   `docs(plans): close architecture plan`.

## Verification

- `git branch --show-current` is `architecture`; `master` is unchanged; nothing pushed.
- From a fresh `git clone` into the scratchpad: `npm ci` succeeds and builds `dist/cli.js`.
- `npm run typecheck` and `npm run lint` are clean.
- `npx rx-report < /dev/null` runs the empty `main` and exits 0.
- `grep -rl "dinero.js" src` lists only `src/money.ts`.
- `npm test` still reports no test files (expected until the functionality plan adds the first test).
- README and AGENTS.md mention `rx-report`, not `prescription-report` or `<command>`.

## Appendix: agreed README text

Usage, exit codes:

| Code | Meaning                                                                                        |
| ---- | ---------------------------------------------------------------------------------------------- |
| 0    | Every line was valid and the report is complete                                                |
| 1    | The report was printed, but some lines were rejected and skipped. Each one is listed on stderr |
| 2    | No report was printed. The command was used wrongly or the input couldn't be read              |

Assumptions:

- **Report order.** The spec doesn't state an order. The sample matches patients sorted by fills, most first, with ties broken by name in alphabetical order, so the report uses that.
- **Income format.** Prices are whole dollars ($5 per fill, $1 per return), so all income is a whole number of dollars and prints without decimals ($9, -$1, $0). A negative amount puts the minus sign before the dollar sign, as in the sample.
- **Fill count wording.** A count of one prints as "1 fill" and every other count as "fills". The sample never shows a count of one, so this is chosen for readability.
- **A prescription is a patient and a drug.** The input has no prescription number, so Mark B is one prescription. The spec says a prescription can be filled many times and won't be created twice, so a second created for the same patient and drug is rejected and reported like a malformed line.
- **Who appears in the report.** A patient is listed only if at least one of their prescriptions was created. Paul's only event is a fill with no created, so he is missing from the sample output. Nick was created but never filled, so he shows zeros.
- **Returns.** A return cancels one fill and costs $1. Mark has three fill events and one return in the sample, which gives 2 fills and $9.
- **A return needs a fill to cancel.** The spec says a return cancels a prior fill and always has one. A return is only applied if the prescription has a fill that hasn't already been cancelled. A return with nothing to cancel is rejected and reported like a malformed line, with no fill cancelled and no $1 charged. This covers a return with no fill at all, a second return for a single fill, and a return whose only fill was discarded because it came before created.
- **Events before created.** Fills and returns before created are discarded for good. A later created starts the prescription from zero.
- **Names.** Patient and drug names can be any text without spaces. The sample's single letters read as placeholders. Names and event names match exactly, including case, so mark and Mark are different patients and Filled is an unknown event.
- **Line format.** Fields are separated by single spaces, as the spec describes the file as space-delimited. A line with extra spaces, a leading or trailing space, or more or fewer than three fields is malformed. Empty lines are skipped because they hold no event.
- **Input source.** If a filename is given, the program reads that file and ignores stdin. Otherwise it reads stdin.
- **Malformed lines.** The spec doesn't cover them. A line with the wrong number of fields or an unknown event is skipped and reported, following the spec's own rule of discarding fills and returns before created. See Error Handling and Edge Cases.

Design Tradeoffs, new "Design" heading:

- **Dinero.js for money instead of a hand-written class**
  - Today the report only adds and multiplies whole dollars, so a small class would be enough.
  - Dinero.js stores money as integer cents with immutable values, so supporting prices with cents later is a change to money.ts only.
  - The cost is one runtime dependency to keep updated. It has no dependencies of its own.
  - Only money.ts imports it, so replacing it later would touch one file.
- **Income rules live with the pharmacy rules**
  - The $5 per fill and $1 per return sit in pharmacy.ts next to the rules about created, filled and returned, so every rule from the spec is in one module.
  - Pricing that varies (per drug, from config) would be better as its own module that turns fills and returns into money. With one fixed price per event, that module would only hold two constants.

Data Structures, one sentence: the summary field is `netFills` because returns cancel fills, so it isn't the number of fill events.

Error Handling and Edge Cases:

A malformed line is skipped and the rest of the file is still processed. Each skipped line is written to stderr with its line number and the reason, so stdout only ever holds the report and can be piped or saved safely. Lines the spec says can't happen (a second created, or a return with no fill to cancel) are handled the same way.

A skipped line might belong to a patient, so their fills and income could be wrong. The report is still printed, but the command exits with 1 instead of 0. A script that runs the report and then uses it (for example with &&) stops, unless it chooses to accept a partial report.

Then the example run (stderr lines first, then the report, then `echo $?` showing 1), using the spec sample with `Mark B` at line 4 and `John E cancelled` at line 10:

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

Then the input cases: an empty file prints nothing and exits 0. A missing or unreadable file, or a directory, prints an error to stderr and exits 2. Running with no filename and nothing piped in prints usage and exits 2 instead of waiting for input.

Future Improvements (after the existing HTTP API bullet):

- **Drug catalog.** Drug names are accepted as free text because the report only counts fills and income, and nothing in it depends on which drug was filled. A real pharmacy would check each drug against a catalog of drug codes (in the US, NDC codes). That catalog would be data passed to the parser, so adding a drug wouldn't need a code change. Per-drug pricing would be the first change that needs the logic to know which drug it is.
- **Patient and prescription IDs.** Patients are identified by name and prescriptions by patient and drug, because that is all the input carries. Two patients with the same name would be merged, and a new prescription for the same drug (for example after the refills run out) can't be told apart from the old one. A real system would key events on a patient ID and a prescription number.
- **Prices with cents or another currency.** Prices are whole US dollars today. Money is stored in cents through Dinero.js, so a price like $4.50 or a second currency is a change inside money.ts, plus a decision on how the report prints it.
- **Sort option.** The report order is fixed (fills, then name). A flag such as --sort income would let a reader choose. It would be the first option the CLI takes, and the point to reconsider a small argument parser instead of reading process.argv by hand.
- **State across runs.** Each run starts with no history, so the input must hold every event from each prescription's creation onwards. If events arrived in daily files, a prescription created yesterday and filled today would have today's fill discarded. A small database such as SQLite would keep prescriptions between runs, and it would sit naturally behind the HTTP API.

## Outcome (2026-11-24)

Done, on branch `architecture` (not pushed, not merged). All steps complete. Verified from a fresh clone of the
branch: `npm ci` builds `dist/cli.js`, typecheck and lint are clean, `npx rx-report < /dev/null` exits 0, only
`src/money.ts` imports `dinero.js`, and `npm test` exits 1 with "No test files found" as expected. README,
AGENTS.md and `package.json` no longer mention `prescription-report` or `<command>`.

Dinero.js 2.0.2 API, from its installed type definitions:

- Value type `Dinero<TAmount, TCurrency extends string = string>`, so `Dinero<number>` works as planned.
- Created with `dinero({ amount, currency, scale? })`; `add`, `subtract` and `multiply(d, n)` all exist;
  `toSnapshot(d)` returns `{ amount, currency, scale }`; `isNegative` and `toUnits` are also available.
- `USD` is exported from `dinero.js` itself as well as from `dinero.js/currencies`, so `money.ts` needs only one import.

Changes from the plan:

- `FILL_INCOME` and `RETURN_PENALTY` are exported, not module-private, because ESLint rejects unused private
  constants until the rules that use them exist. The functionality plan can make them private again. They call the
  `Money.dollars` stub, so importing `pharmacy.ts` throws until `Money` is implemented.
- `Money.zero` is a static getter, so it can be a stub.
- `eslint.config.js` gained `argsIgnorePattern: "^_"` for the stub parameters, as the plan allowed.
- Installing Dinero.js also let npm drop two optional dev-only lockfile entries (`@emnapi/core`, `@emnapi/runtime`).
- The settled output-order memory was moved to the memory folder's `_quarantine_2026-11-24/`, not deleted.
- README Project Structure lists `tests/`, which the functionality plan creates.

Still deferred: everything under "Deferred to the functionality plan" above, starting with the acceptance test.
