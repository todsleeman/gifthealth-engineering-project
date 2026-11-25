# Functionality plan: build rx-report test-first

## Context

The scaffolding plan (`docs/plans/scaffolding.md`) left every function in `src/` as a typed stub whose TSDoc is
its contract, and every test in `tests/` as an `it.todo` named after the spec rule it checks. Tod reviewed and
accepted its decisions on 2026-11-25 (its Review section), so the stubs, the decisions S1 to S24 and the README's
Assumptions are the plan as written.

This plan builds the behaviour. Each `it.todo` becomes a real test, the test is run and seen to fail, and then
the stub is implemented until it passes. The work is done by an agent on branch `functionality`, pushed, and
opened as a PR against `master` for Tod to review. The agent doesn't merge it.

Anything built differently from the plan as written is recorded under
[Deviations from the plan](#deviations-from-the-plan), with what the plan said, what was done and why. The same
list goes in the PR body.

## Scaffolding decisions carried forward

Reasons and alternatives are in `docs/plans/scaffolding.md`.

| #   | Decision, in one line                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Scaffolding branch history only; superseded here by F1                                                                             |
| S2  | Stubs throw "not implemented" and carry a TSDoc contract; the contracts are what this plan builds against                          |
| S3  | `Rejection` is a discriminated union carrying what its message needs; `RuleRejection` is the pharmacy's subset                     |
| S4  | `ParseResult` has no line number; `run` numbers lines                                                                              |
| S5  | `parseLine` returns `undefined` for an empty line                                                                                  |
| S6  | The rules are a `Pharmacy` class with a private nested Map, `#patients` once `apply` uses it                                       |
| S7  | `apply(event)` returns a `RuleRejection` or `undefined`                                                                            |
| S8  | A prescription's state is `{ fills, returns }`                                                                                     |
| S9  | `Rejection` lives in `types.ts`                                                                                                    |
| S10 | `input.ts`: `chooseInput`, `openInput` (no early file check) and `readLines`                                                       |
| S11 | `app.ts`: `run`, `describeRejection`, `USAGE`, `ExitCode`, `Io`                                                                    |
| S12 | `cli.ts` is the entry point only                                                                                                   |
| S13 | `formatReport` returns a sorted copy as lines                                                                                      |
| S14 | Pharmacy rejection messages: `prescription Mark B already created`, `Mark B returned with no fill to cancel`                       |
| S15 | Ties in net fills sort by name with `localeCompare(b, "en")`                                                                       |
| S16 | Tests start as `it.todo`, one file per module plus `cli.test.ts`                                                                   |
| S17 | `FILL_INCOME` and `RETURN_PENALTY` stay exported; built differently (deviation 7)                                                  |
| S18 | Exit codes 0 (report printed) and 1 (no report); its reading part is replaced by S23                                               |
| S19 | Extra spaces make empty fields, which count: `Mark  B filled` has 4 fields                                                         |
| S20 | `USAGE` is `usage: rx-report [file]` and `Reads prescription events from file, or from stdin if no file is given.`                 |
| S21 | Unreadable input is `rx-report: ` plus Node's error message                                                                        |
| S22 | No plan decision IDs in `src/` or `tests/`                                                                                         |
| S23 | The first rejected line, from the parser or the rules, stops the run: stderr only, exit 1                                          |
| S24 | A return with nothing to cancel after `created` is discarded if a fill was discarded before `created` and unused (reversed by F15) |

## Decisions

| #   | Decision                                                                                                                                                                                                                                   | Why                                                                                                                                                                                                                              | Status                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| F1  | Branch `functionality` from `master`; the agent pushes it and opens a PR against `master`, and doesn't merge                                                                                                                               | Tod's request, 2026-11-25                                                                                                                                                                                                        | Tod                                          |
| F2  | Acceptance setup: `vitest.config.ts` names a global setup, `tests/global-setup.ts`, that runs `npm run build` once before any test, and fixtures live in `tests/fixtures/` (spec sample input, its expected output, the two-error example) | The acceptance tests run `dist/cli.js`, so a stale build would test old code. Building once keeps the suite fast. Agreed before this plan (handoff)                                                                              | Tod                                          |
| F3  | `readLines` closes the readline interface and destroys the stream when reading stops, whether at the end or early                                                                                                                          | The run stops at the first rejected line (S23), so the file stream must not be left open                                                                                                                                         | Agent                                        |
| F4  | Tests compare `Money` through `format()`                                                                                                                                                                                                   | `Money` has no equality method, and comparing Dinero objects structurally would test the library's internals                                                                                                                     | Agent                                        |
| F5  | `Pharmacy` keeps fills discarded before `created` in a second private Map, `#discardedFills`, keyed patient then drug, separate from `#patients` (reversed by F15)                                                                         | S24 needs a count for prescriptions that may never be created. Keeping it out of `#patients` means those patients never reach `summaries()`, and `Prescription` stays `{ fills, returns }`                                       | Agent                                        |
| F6  | A usage error writes `rx-report: ` and what was wrong (`no file given and stdin is a terminal`, or `expected at most one file, got 2 arguments`), then `USAGE`. The reason is `InputSource`'s `message`, set by `chooseInput`              | `InputSource` already carries a message, and the user should learn which mistake they made. `chooseInput` can't return `USAGE` itself: `app.ts` imports `input.ts`, so importing `USAGE` back would be circular                  | Agent                                        |
| F7  | `Money.dollars` accepts a whole number only if its value in cents is a safe integer                                                                                                                                                        | Dinero.js stores cents. A dollar amount near `Number.MAX_SAFE_INTEGER` is a safe integer, but times 100 it isn't, and would be stored inexactly                                                                                  | Agent                                        |
| F8  | Two tests beyond the outline: `readLines` destroys the stream when the caller stops early, and the README's two-error example reports line 10 once line 4 is fixed                                                                         | The first checks F3 (without the destroy call, a stream left by `break` stays open). The second checks a claim the README makes                                                                                                  | Agent                                        |
| F9  | `describeRejection` builds `created, filled or returned` from `EVENT_KINDS`                                                                                                                                                                | The message and the parser's check can't drift apart, the same reason `EventKind` is built from the list                                                                                                                         | Agent                                        |
| F10 | `Money`'s arithmetic is `add`, `subtract` and `multiply`, not `plus`, `minus` and `times` (`add` removed by F17)                                                                                                                           | Tod's PR review: the clearer words for money                                                                                                                                                                                     | Tod                                          |
| F11 | `Money.multiply` throws a `RangeError` for a count that isn't whole                                                                                                                                                                        | Its contract said the count must be whole, and `dollars` already enforces its own rule. Found by the fresh-context review                                                                                                        | Agent                                        |
| F12 | A return cancels a fill made after `created` before it uses up a fill discarded before `created`, pinned by a test and stated in the README (removed with F15)                                                                             | The code already did this, but no test failed when the order was swapped. When it could be either, the return counts and costs $1. Found by the fresh-context review                                                             | Agent                                        |
| F13 | `cli.ts` ignores `EPIPE` and `ENOTCONN` on stdout, so `rx-report file \| head -1` ends quietly with the run's exit code (reversed by F16)                                                                                                  | Without it, the closed pipe crashed with an unhandled error and a stack trace. Found by the fresh-context review                                                                                                                 | Agent                                        |
| F14 | `readLines` drops a byte order mark at the very start of the input                                                                                                                                                                         | Some Windows editors add one, and it became part of the first patient's name, so that patient didn't match later lines. Found by the fresh-context review                                                                        | Agent                                        |
| F15 | S24 reversed: a fill before `created` is discarded and never counts, so a return after `created` with no fill made since is a `nothing-to-return` rejection. `#discardedFills` and `ByPrescription<T>` are gone                            | The spec says events before `created` "must be discarded" and that a return "will always have a prior filled event": a discarded fill isn't one, so such a return is broken input, the same as any return with nothing to cancel | Tod, 2026-11-25, after the simplicity review |
| F16 | The stdout `EPIPE`/`ENOTCONN` handler and its test are removed; `cli.ts` is the entry point only again (S12)                                                                                                                               | It only mattered for reports bigger than the pipe buffer, needed platform-specific knowledge to get right, and brought the suite's oddest test                                                                                   | Tod, from the simplicity review              |
| F17 | `Money.zero` and `Money.add` are removed                                                                                                                                                                                                   | Nothing in `src/` used them                                                                                                                                                                                                      | Tod, from the simplicity review              |
| F18 | README: Code Organization trimmed to what Project Structure and Design Tradeoffs don't already say, and the "Returns" assumption (a repeat of Problem Summary) removed. Future Improvements kept as written                                | Repetition, found by the simplicity review. Tod chose to keep every Future Improvement                                                                                                                                           | Tod                                          |

## Implementation steps (for the agent; Tod reviews the PR)

The agent runs these without stopping, unless a step would change a module boundary, the data model or the
dependencies. Then it asks Tod and waits.

1. `git switch -c functionality` from `master`. Write this plan. Commit: `docs(plans): add functionality plan`.
2. **Acceptance tests, red** (F2). Add `vitest.config.ts`, `tests/global-setup.ts` and `tests/fixtures/`, and turn
   the `it.todo` entries in `tests/cli.test.ts` into tests. Run them and see them fail on "not implemented".
   Commit: `chore(tests): add acceptance tests on the built cli`. The suite stays red until step 8.
3. **Money.** Turn `tests/money.test.ts` into tests, see them fail, implement `src/money.ts`. Commit:
   `feat(money): implement whole-dollar money`.
4. **parseLine.** Same for `tests/events.test.ts` and `src/events.ts`. Commit: `feat(events): parse event lines`.
5. **Pharmacy.** Same for `tests/pharmacy.test.ts` and `src/pharmacy.ts`, with `#patients` (S6), `#discardedFills`
   (F5) and the income constants unexported (deviation 7). Commit: `feat(pharmacy): apply the prescription rules`.
6. **Report.** Same for `tests/report.test.ts` and `src/report.ts`. Commit: `feat(report): order and format the
report`.
7. **Input.** Same for `tests/input.test.ts` and `src/input.ts` (F3). Commit: `feat(input): choose, open and read
the input`.
8. **run.** Same for `tests/app.test.ts` and `src/app.ts`. The acceptance tests from step 2 now pass. Commit:
   `feat(app): run the report`.
9. **TSDoc pass.** Read every TSDoc comment in `src/` against the code: accurate, about behaviour and constraints,
   no decision IDs, no planning wording, no history. Commit only if something changed: `docs(src): ...`.
10. **Docs.** In `docs/architecture.md`, replace the scaffolding-stage wording ("Every function below is a stub",
    S codes) with a description of the code as built. Check the README's Testing Strategy, Project Structure,
    Architecture and Design and Error Handling against the code. Commits: `docs(architecture): ...`,
    `docs(readme): ...`.
11. **AGENTS.md.** Record what future agents need (acceptance setup, fixtures, the S24 state) and drop
    stub-stage notes that no longer hold. Commit: `docs(agents): record functionality decisions`.
12. **Verify** (below), then add an Outcome section to this plan with the results, the final decisions and
    anything left open. Commit: `docs(plans): close functionality plan`.
13. **Push and open the PR** against `master`, with the deviation list in its body. Don't merge.
14. **Finish List doc.** Tick the functionality and docs items, link the PR, mark PR #2 merged, and tick the
    Housekeeping item about deleting the `scaffolding` branch.
15. **Tod.** Review the PR and its deviations, then merge it yourself.

Out of scope: the submission scan of `docs/plans/` and AGENTS.md, the zip, and the S6 walkthrough.

## Verification

- `npm run check` exits 0 on the default Node and `npm test` exits 0 on Node 22.22.1
  (`PATH=~/.nvm/versions/node/v22.22.1/bin:$PATH npm test`).
- `npx rx-report tests/fixtures/spec-sample.txt` and `cat tests/fixtures/spec-sample.txt | npx rx-report` print
  exactly the spec's expected output and exit 0.
- `npx rx-report tests/fixtures/two-errors.txt` prints only `line 4: expected 3 fields, found 2` on stderr,
  nothing on stdout, and exits 1, as the README shows.
- `grep -rnE '\b[ASF][0-9]+\b' src tests` finds no plan decision IDs.
- `grep -rl dinero.js src` lists only `src/money.ts`.

## Deviations from the plan

Each entry says what the plan said, what was done and why.

1. **Usage error text** (S20, `run`'s contract). The plan: a usage error writes `USAGE` to stderr. Built: a line
   `rx-report: <what was wrong>` first, then `USAGE` (F6). Why: `InputSource`'s usage error already carries a
   message that would otherwise go unused, and it tells the user which of the two mistakes they made.
2. **`Money.dollars` range** (its contract: "Throws a `RangeError` unless `amount` is a safe integer"). Built:
   also throws when the amount in cents isn't a safe integer (F7). Why: Dinero.js stores cents, so a large but
   safe dollar amount would be stored inexactly. The test for "amounts too large to be exact" uses
   `Number.MAX_SAFE_INTEGER` dollars.
3. **`readLines` closes its stream** (its contract said nothing about closing). Built: it closes the readline
   interface and destroys the stream when reading stops, at the end, on an error or early (F3). Why: readline
   leaves its input open when the caller stops early, and the run stops at the first rejected line.
4. **Tests beyond the outline** (the outline had 98 `it.todo` entries; there are 99 tests). Added: the
   early-close test for `readLines` and the README's "fixing it reports line 10" claim (F8), two for the byte
   order mark and one for `multiply`'s whole count. Gone with the code they checked: `Money.zero` and
   `Money.add` (F17), and four S24 tests, replaced by one for the reversed rule (F15).
5. **`vitest.config.ts` added to `tsconfig.json`'s `include`**. The plan named the config file but not this. Why:
   so the type check and the type-aware lint cover it, as they cover `src/` and `tests/`.
6. **README additions beyond the checks the plan listed.** Error Handling now shows the usage output, Data
   Structures says events before created are never stored, and Project Structure lists `tests/fixtures/` and
   `tests/global-setup.ts`. Why: each describes code this plan added.
7. **Income constants unexported** (S17 said "`FILL_INCOME` and `RETURN_PENALTY` stay exported"). Built:
   both are private to `pharmacy.ts`. Why: S17's only reason was that lint rejects unused private constants,
   and the rules now use them. The handoff asked for this, but S17 as written didn't.
8. **`Money` API** (the architecture plan and the stubs: `zero`, `plus`, `minus`, `times`). Built: `subtract`
   and `multiply` (F10, Tod's review on PR #3). `zero` and `plus` (renamed `add`) are removed because nothing
   uses them (F17).
9. **`Money.multiply` enforces a whole count** (its contract only said the count must be whole). Built: it
   throws a `RangeError` otherwise (F11).
10. **S24 reversed** (S24: a return whose only fill came before `created` is discarded with it). Built: it is a
    `nothing-to-return` rejection, like any return with nothing to cancel (F15). Why: Tod's reading of the spec,
    that a discarded fill is not a prior fill.
11. **Byte order mark** (the line format assumption didn't cover it). Built: one at the very start of the input
    is dropped (F14), with tests, and the README's Line format assumption says so.
12. **Smaller review fixes.** The `readLines` TSDoc now says only a Node `Readable` is destroyed,
    `docs/architecture.md` says only constants live at module level, the README says the one argument is
    always a filename (`-` and `--help` included), `KNOWN_EVENTS` sits next to `USAGE`, and one test title now
    names only what it checks.

## Outcome (2026-11-25)

Steps 1 to 14 done on branch `functionality`, PR #3 open. Step 15 is Tod's review.

Verification:

- `npm run check` exits 0 on Node 25.2.0. `npm test` exits 0 on Node 22.22.1. 99 tests pass on both.
- `npx rx-report tests/fixtures/spec-sample.txt` and `cat tests/fixtures/spec-sample.txt | npx rx-report` exit 0
  and their stdout is byte for byte `tests/fixtures/spec-sample.expected.txt` (checked with `cmp`).
- `npx rx-report tests/fixtures/two-errors.txt` prints only `line 4: expected 3 fields, found 2` on stderr,
  nothing on stdout, and exits 1.
- A missing file prints `rx-report: ENOENT: no such file or directory, open 'events.txt'`, a directory
  `rx-report: EISDIR: illegal operation on a directory, read`, both exit 1. Two arguments and a terminal on
  stdin print the reason and `USAGE`, exit 1. Empty input prints nothing, exit 0.
- A bad first line followed by 2 million good lines stops in under 50 ms, from a file and from a pipe.
- No plan decision IDs in `src/` or `tests/`. Only `src/money.ts` imports Dinero.js.

Each module's tests were run and seen to fail on "not implemented" before the module was built. The acceptance
tests stayed red from their commit until `run` was built.

Nothing in this plan is open. Still out of scope: the submission scan of `docs/plans/` and AGENTS.md, the zip,
and the S6 walkthrough.

## Review (2026-11-25)

A fresh-context review agent read the PR against the spec, the README and S1-S24, and Tod left three comments
on `src/money.ts`. Everything both raised was fixed on this branch as F10-F14 and deviations 7-12. The
reviewer found no bug in the spec's rules. A second review found that the closed-stdout handler missed
`ENOTCONN` on macOS, which made its test fail about 1 run in 7.

A simplicity review then asked what to remove. Tod chose to reverse S24 on his reading of the spec (F15), and to
remove the closed-stdout handler (F16), `Money.zero` and `Money.add` (F17) and README repetition (F18). Left as
they are: a tab inside a field shows as an invisible character in the `unknown event` message, which the
single-space rule accepts, and leaving `docs/plans/` out of the zip, which is for the submission scan.
