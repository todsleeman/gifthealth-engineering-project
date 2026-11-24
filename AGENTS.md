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
- Run: `node dist/cli.js <file>` or `cat <file> | node dist/cli.js` (rebuild first)

## Toolchain

Decisions and reasons: `docs/plans/infrastructure.md`.

- Build output is `dist/`, gitignored, built by `prepare` on install.
- Tests use Vitest (chosen over Jest: native TypeScript and ESM), in `tests/` mirroring `src/`.
- ESM with NodeNext: relative imports end in `.js`.
- Supported floor is Node 22: `@types/node` stays on 22 and `lib` on ES2024, so newer APIs fail typecheck.
- No runtime dependencies.

## Done means

Typecheck clean, tests pass, and the sample in the spec produces its expected output exactly.

## Rules

- Record every assumption in the README's Assumptions section.
- Change only what the task asks. No new dependencies without asking.
- Design decisions and their reasons live in the README. Don't change module boundaries or the
  data model without asking.
- Tests are named after the spec rule they check; write the test first and see it fail.
- README reasoning sections are Tod's writing: suggest, don't write.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`.

- Types: `feat` (new behaviour), `fix` (bug fix), `docs` (documentation only), `chore` (tooling, config, housekeeping).
- Scope: the part of the project the change touches, in parentheses, e.g. `parser`, `report`, `cli`, `tests`, `readme`.
- Summary: imperative, lower case, no trailing full stop.
- One logical change per commit.
