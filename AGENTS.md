# Agent Notes

Take-home for Gifthealth: a CLI that reads prescription events (file argument or stdin)
and prints fills and income per patient. Graded on design, readability, tests and README reasoning.

Spec: `Gifthealth Engineering Project.md` (gitignored; read it, never edit it), as interpreted
by the README's Assumptions section, which wins where they differ. If neither decides something,
stop and ask.

## Commands

- Install (also builds): `npm ci`
- Build: `npm run build`
- Everything below at once: `npm run check`
- Typecheck: `npm run typecheck`
- Lint and format check: `npm run lint` (fix formatting with `npm run format`)
- Test: `npm test`
- Run: `npx rx-report <file>` or `cat <file> | npx rx-report` (or `node dist/cli.js`; rebuild first)

## Toolchain

Decisions and reasons: `docs/plans/infrastructure.md`.

- Build output is `dist/`, gitignored, built by `prepare` on install.
- Tests use Vitest (chosen over Jest: native TypeScript and ESM), in `tests/` mirroring `src/`.
- ESM with NodeNext: relative imports end in `.js`.
- Supported floor is Node 22: `@types/node` stays on 22 and `lib` on ES2024, so newer APIs fail typecheck.
- No unnecessary runtime dependencies: each needs Tod's OK and a README reason. The only one is
  dinero.js, imported only by `src/money.ts`.

## Architecture

Module map and types: `docs/architecture.md`. Decisions (A1-A24), rejected options and what is deferred:
`docs/plans/architecture.md`.

- `src/types.ts` holds the domain types the core modules share, with the `EVENT_KINDS` list `EventKind` is built
  from. Types for the I/O edge stay with the code that uses them (`ExitCode` and `Io` in `app.ts`, `InputSource`
  in `input.ts`). `Money` stays a class in `money.ts`. It is `.ts`, not `.d.ts`, because `skipLibCheck` would
  skip checking a `.d.ts` (A24).
- Money is a `Money` class around Dinero.js, whole US dollars only; nothing outside `money.ts` imports Dinero (A6, A7).
- Report order is net fills descending, then name ascending (A10).
- A malformed line, a second `created` or a return with no fill to cancel is an error: the first one is written
  to stderr with its line number, reading stops, and no report is printed (S18 and S23, replacing A15 and A18). Events are applied in the
  order they happen, so skipping a line would change the history later lines are applied to.
- Exit codes: 0 report printed, 1 no report (a rejected line, a usage error or unreadable input) (S18).

Function outline and the decisions that resolved the architecture plan's deferred items (S1-S24):
`docs/plans/scaffolding.md`. Tod reviewed them on 2026-11-25: all accepted, some changed (the plan's Review section).
How they were built, decisions F1-F18 and the deviations from that plan: `docs/plans/functionality.md`.

- `src/cli.ts` is the entry point only. `run(args, io)` lives in `src/app.ts`, so tests import it and pass fake
  streams. Don't import `cli.ts` in tests: importing it starts the CLI.
- Each function's TSDoc is its full contract. Change the behaviour and its TSDoc and test together, test first.
- `Pharmacy` keeps only `#patients` (created prescriptions, `{ fills, returns }`). Fills and returns before
  `created` are never stored, so a return after `created` can only cancel a fill made after it (Tod reversed S24
  on 2026-11-25).
- `readLines` drops a byte order mark at the very start of the input, and destroys its stream when reading
  stops, so the early stop at a rejected line releases the file.
- A usage error prints `rx-report: <what was wrong>` and then `USAGE`.
- Acceptance tests (`tests/cli.test.ts`) run the built `dist/cli.js`. `tests/global-setup.ts` builds it once
  before any test. Inputs and expected output are in `tests/fixtures/`.

## Done means

Typecheck clean, tests pass, and the sample in the spec produces its expected output exactly.

## Rules

- Record every assumption in the README's Assumptions section.
- Change only what the task asks. No new dependencies without asking.
- Design decisions and their reasons live in the README. Don't change module boundaries or the
  data model without asking.
- Tests are named after the spec rule they check; write the test first and see it fail.
- No plan decision IDs (such as A17 or S18) in `src/` or `tests/`: name the rule in words.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`.

- Types: `feat` (new behaviour), `fix` (bug fix), `docs` (documentation only), `chore` (tooling, config, housekeeping).
- Scope: the part of the project the change touches, in parentheses, e.g. `parser`, `report`, `cli`, `tests`, `readme`.
- Summary: imperative, lower case, no trailing full stop.
- One logical change per commit.
