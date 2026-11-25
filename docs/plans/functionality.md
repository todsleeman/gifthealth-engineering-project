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

| #   | Decision, in one line                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------ |
| S1  | Scaffolding branch history only; superseded here by F1                                                             |
| S2  | Stubs throw "not implemented" and carry a TSDoc contract; the contracts are what this plan builds against          |
| S3  | `Rejection` is a discriminated union carrying what its message needs; `RuleRejection` is the pharmacy's subset     |
| S4  | `ParseResult` has no line number; `run` numbers lines                                                              |
| S5  | `parseLine` returns `undefined` for an empty line                                                                  |
| S6  | The rules are a `Pharmacy` class with a private nested Map, `#patients` once `apply` uses it                       |
| S7  | `apply(event)` returns a `RuleRejection` or `undefined`                                                            |
| S8  | A prescription's state is `{ fills, returns }`                                                                     |
| S9  | `Rejection` lives in `types.ts`                                                                                    |
| S10 | `input.ts`: `chooseInput`, `openInput` (no early file check) and `readLines`                                       |
| S11 | `app.ts`: `run`, `describeRejection`, `USAGE`, `ExitCode`, `Io`                                                    |
| S12 | `cli.ts` is the entry point only                                                                                   |
| S13 | `formatReport` returns a sorted copy as lines                                                                      |
| S14 | Pharmacy rejection messages: `prescription Mark B already created`, `Mark B returned with no fill to cancel`       |
| S15 | Ties in net fills sort by name with `localeCompare(b, "en")`                                                       |
| S16 | Tests start as `it.todo`, one file per module plus `cli.test.ts`                                                   |
| S17 | `FILL_INCOME` and `RETURN_PENALTY` become unexported once the rules use them                                       |
| S18 | Exit codes 0 (report printed) and 1 (no report); its reading part is replaced by S23                               |
| S19 | Extra spaces make empty fields, which count: `Mark  B filled` has 4 fields                                         |
| S20 | `USAGE` is `usage: rx-report [file]` and `Reads prescription events from file, or from stdin if no file is given.` |
| S21 | Unreadable input is `rx-report: ` plus Node's error message                                                        |
| S22 | No plan decision IDs in `src/` or `tests/`                                                                         |
| S23 | The first rejected line, from the parser or the rules, stops the run: stderr only, exit 1                          |
| S24 | A return with nothing to cancel after `created` is discarded if a fill was discarded before `created` and unused   |

## Decisions

| #   | Decision                                                                                                                                                                                                                                   | Why                                                                                                                                                                                        | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| F1  | Branch `functionality` from `master`; the agent pushes it and opens a PR against `master`, and doesn't merge                                                                                                                               | Tod's request, 2026-11-25                                                                                                                                                                  | Tod    |
| F2  | Acceptance setup: `vitest.config.ts` names a global setup, `tests/global-setup.ts`, that runs `npm run build` once before any test, and fixtures live in `tests/fixtures/` (spec sample input, its expected output, the two-error example) | The acceptance tests run `dist/cli.js`, so a stale build would test old code. Building once keeps the suite fast. Agreed before this plan (handoff)                                        | Tod    |
| F3  | `readLines` closes the readline interface and destroys the stream when reading stops, whether at the end or early                                                                                                                          | The run stops at the first rejected line (S23), so the file stream must not be left open                                                                                                   | Agent  |
| F4  | Rejected-line tests and pharmacy tests compare `Money` through `format()`                                                                                                                                                                  | `Money` has no equality method, and comparing Dinero objects structurally would test the library's internals                                                                               | Agent  |
| F5  | `Pharmacy` keeps fills discarded before `created` in a second private Map, `#discardedFills`, keyed patient then drug, separate from `#patients`                                                                                           | S24 needs a count for prescriptions that may never be created. Keeping it out of `#patients` means those patients never reach `summaries()`, and `Prescription` stays `{ fills, returns }` | Agent  |

Further decisions made while building are added here as F6 onwards, and any that change what the plan said are
also listed under Deviations.

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
   (F5) and the income constants unexported (S17). Commit: `feat(pharmacy): apply the prescription rules`.
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

Filled in while building. Each entry says what the plan said, what was done and why.
