# Scaffolding plan: full function outline and test outline for rx-report

## Context

The architecture plan (`docs/plans/architecture.md`) left a loose skeleton: the agreed types and a few stubs,
with several shapes deferred. Tod asked (2026-11-24) for a full scaffolding branch on top of it, built by an
agent while he wasn't watching: every module and exported function as a typed stub with its contract written
down, and every test as a Vitest `it.todo` named after the spec rule or decision it checks.

Nothing here behaves. The functionality plan takes each `it.todo`, turns it into a failing test, and then
implements the stub until it passes (AGENTS.md: write the test first and see it fail).

To produce a complete outline, this branch has to pick answers to the questions the architecture plan
deferred. Those answers are **proposals**. They are marked "Proposed (needs Tod's OK before merge)" below, each
with its alternative, and the branch should not be merged until Tod has accepted or changed them.

## Decisions

Decisions marked **Proposed** resolve something the architecture plan deferred, or change a module boundary or
the data model. They need Tod's OK before merge. The rest follow directly from the architecture plan or the
instructions for this branch.

| #   | Decision                                                                                                                                                                                                                                                                       | Why                                                                                                                                                                                                                                                                       | Status                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| S1  | Branch `scaffolding` on top of `architecture`; never pushed or merged by the agent                                                                                                                                                                                             | Tod's request, 2026-11-24                                                                                                                                                                                                                                                 | Tod                         |
| S2  | Stub bodies are `throw new Error("not implemented")`, stub parameters start with `_`, and every exported function carries a short TSDoc contract naming the spec rule or decision it implements                                                                                | The contract is the spec for the test the functionality plan writes first                                                                                                                                                                                                 | Follows architecture step 4 |
| S3  | `RejectReason` becomes `Rejection`, a discriminated union that carries what the stderr message needs: `wrong-field-count` (`fieldCount`), `unknown-event` (`word`), `duplicate-created` (`event`), `nothing-to-return` (`event`). `RejectReason = Rejection["reason"]` is kept | A bare code can't produce `found 2` or `"cancelled"` without the message code re-reading the line. Alternative: keep string codes and pass the raw line to the message function                                                                                           | **Proposed**                |
| S4  | `ParseResult` has no line number: `{ ok: true; event } \| { ok: false; rejection }`                                                                                                                                                                                            | The caller already counts lines, and pharmacy rejections need numbering too, so numbering lives in one place. Alternative: keep `lineNumber` in `ParseResult` and add it to pharmacy rejections separately                                                                | **Proposed**                |
| S5  | `parseLine(line): ParseResult \| undefined`, where `undefined` means an empty line (A12)                                                                                                                                                                                       | An empty line is neither an event nor a rejection. Alternative: the caller skips empty lines before calling `parseLine`                                                                                                                                                   | **Proposed**                |
| S6  | The pharmacy rules are a `Pharmacy` class: `apply(event)` and `summaries()`, holding a private `Map<PatientName, Map<DrugName, Prescription>>`                                                                                                                                 | Per-run state needs either a class or state passed around. A class keeps the Map private and each run starts with `new Pharmacy()` (A22). Alternative: `createLedger()`, `applyEvent(ledger, event)` and `summarise(ledger)` functions                                    | **Proposed**                |
| S7  | `apply(event): Rejection \| undefined`. `undefined` means applied, or discarded under the spec's before-created rule. A rejection is returned for a second `created` (A16) or a return with no fill to cancel (A17)                                                            | Keeps the core synchronous and free of line numbers. The caller numbers the rejection and writes it at once, so warnings come out in line order as the file streams. Alternative: an `onReject` callback, or rejections collected inside the pharmacy and read at the end | **Proposed**                |
| S8  | A prescription's internal state is `{ fills: number; returns: number }` (not exported)                                                                                                                                                                                         | Net fills and income are both derived from these two counts when summaries are built, so nothing is tracked twice. Alternative: `{ netFills, returns }`                                                                                                                   | **Proposed**                |
| S9  | `Rejection` and `RejectReason` live in `types.ts` with the other domain types                                                                                                                                                                                                  | Both the parser and the pharmacy produce them and `run` reads them, so they are shared domain types (A24)                                                                                                                                                                 | Follows A24                 |
| S10 | New `src/input.ts`: `InputSource` (`file`, `stdin` or `usage-error`), `chooseInput(args, stdinIsTTY)` (A14), `openInput(source, stdin)` and `readLines(stream)`                                                                                                                | Picking and opening the input is separate from running the report, and can be tested without the rest. Alternative: these live inside `app.ts`                                                                                                                            | **Proposed**                |
| S11 | New `src/app.ts`: `ExitCode` moves here from `cli.ts`, plus `Io`, `run(args, io)`, `describeRejection(lineNumber, rejection)` and `USAGE`                                                                                                                                      | Tests call `run` in-process with fake streams. They can't import it from `cli.ts`, because importing the entry point would start the CLI. Alternative: keep `run` in `cli.ts` behind an "is this the main module" check                                                   | **Proposed**                |
| S12 | `src/cli.ts` is the entry point only: `process.exitCode = await run(process.argv.slice(2), io)` (A19). Running it on this branch throws "not implemented"                                                                                                                      | The entry point has nothing worth unit testing. The acceptance tests cover it                                                                                                                                                                                             | Follows S11                 |
| S13 | `report.ts` gains `formatReport(summaries): string[]`, a sorted copy turned into lines                                                                                                                                                                                         | `run` then needs one call for the whole report, and the order and format can be tested together                                                                                                                                                                           | Agent                       |
| S14 | Messages for the two pharmacy rejections: `line 3: prescription Mark B already created` and `line 2: Mark B returned with no fill to cancel`                                                                                                                                   | The architecture plan only fixed the two parser messages. Tod may reword these                                                                                                                                                                                            | Agent, open to rewording    |
| S15 | `compareSummaries` breaks ties by comparing names as plain strings (code unit order), not with `localeCompare`                                                                                                                                                                 | Same output on every machine. `localeCompare` depends on the locale data Node was built with. With exact-case names (A13), `Mark` sorts before `mark`                                                                                                                     | **Proposed**                |
| S16 | Tests are `it.todo` titles named after the spec rule or decision, one file per module plus `tests/cli.test.ts` for the acceptance tests. The test files import only `vitest`, not the stubbed modules                                                                          | Importing `pharmacy.ts` throws until `Money` exists, because the income constants call `Money.dollars` at load                                                                                                                                                            | Agent                       |
| S17 | `FILL_INCOME` and `RETURN_PENALTY` stay exported                                                                                                                                                                                                                               | Carried over from the architecture outcome (lint rejects unused private constants)                                                                                                                                                                                        | Carried over                |

### Left open for the functionality plan

- **Stream errors (risk).** Check that readline's async iterator surfaces input-stream errors (`ENOENT`,
  `EISDIR`) on Node 22. If it doesn't, `openInput` opens the file with `fs.promises.open` first, so a missing
  file or a directory fails before any line is read. The `openInput` contract already says it rejects for both.
- **Empty fields.** A double space gives four fields, one of them empty, so the message reads `expected 3
fields, found 4`. That is accurate but may confuse. An `empty-field` reason could replace it.
- **Usage text wording.** `USAGE` is a stub. The exact text is written with its test.
- **Error message for an unreadable file.** The wording of the stderr line for a missing file or a directory
  is written with its test.
- The spec-sample acceptance test is still the first test to turn red (memory: deferred work).
- At submission, whether the zip ships git history.

## Implementation steps (for the agent; Tod reviews before merge)

The agent runs these without stopping. Tod's part is at the end, reviewing the Proposed decisions before merging.

1. `git switch -c scaffolding` from a clean `architecture`. Write this plan to `docs/plans/scaffolding.md`.
   Commit: `docs(plans): add scaffolding plan`.
2. **Source outline** (S2 to S15). Update `src/types.ts`, `src/events.ts`, `src/pharmacy.ts`, `src/report.ts`, `src/cli.ts`, add
   TSDoc contracts to `src/money.ts` (API unchanged), and create `src/input.ts` and `src/app.ts`. Run
   `npm run format`, `npm run typecheck` and `npm run lint`, all clean. Commit:
   `chore(src): outline every module and function`.
3. **Test outline** (S16). Create `tests/events.test.ts`, `money.test.ts`, `pharmacy.test.ts`, `report.test.ts`,
   `input.test.ts`, `app.test.ts` and `cli.test.ts`, covering every README assumption, the spec sample, the exit
   codes and the input cases. `npm test` should exit 0 with only todos. If Vitest exits non-zero for todo-only
   files, record it here and leave it. Commit: `chore(tests): outline tests by spec rule`.
4. **Docs.** Update `docs/architecture.md` (module map with `app.ts` and `input.ts`, the functions per module,
   the data flow with line numbering in `run` and `Pharmacy.apply` returning a rejection, the `Rejection`
   union, Still open). In the README, update Project Structure, Data Flow and Code Organization only where
   modules or flow changed, keeping Tod's wording, and fill in Testing Strategy in his plain style. Commits:
   `docs(architecture): add function outline`, `docs(readme): add testing strategy and updated structure`.
5. **AGENTS.md.** In the Architecture section, record that `cli.ts` is the entry point only and `run` lives in
   `app.ts`, that tests start as `it.todo` and the functionality plan turns each into a failing test before
   implementing it, and point to this plan. Commit: `docs(agents): record scaffolding decisions`.
6. **Verify and close.** Run the checks below, add an Outcome section to this plan (what was done, changes from
   the plan, the Proposed decisions awaiting Tod), and commit: `docs(plans): close scaffolding plan`.
7. **Tod (after the agent finishes).** Review each Proposed decision (S3 to S8, S10, S11 and S15), accept or change it, then
   merge `scaffolding` yourself. Changes to a Proposed decision are cheapest now, before any test is written.

## Verification

- `git branch --show-current` is `scaffolding`. `master` and `architecture` are unchanged. Nothing pushed.
- `npm run typecheck`, `npm run lint` and `npm run build` are clean.
- `npm test` lists only todo tests and exits 0.
- `npx rx-report < /dev/null` fails with "not implemented", as expected on this branch.
- `grep -rl dinero.js src` lists only `src/money.ts`.
- A fresh `git clone --branch scaffolding` into the scratchpad runs `npm ci` successfully.
