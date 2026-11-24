# Infrastructure plan: TypeScript toolchain for the prescription report CLI

## Context

The repo has a README skeleton, AGENTS.md and the brief, but no toolchain. Before any feature work we need
a setup a reviewer can install and build with one command, which typechecks strictly and lints and formats
consistently (the brief grades "code hygiene"). The app, its tests, and the submission zip are out of
scope: the app plan starts with the spec's sample as its first acceptance test.

## Decisions made

| #   | Decision                                                                                                                                 | Why                                                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I1  | TypeScript, `strict` plus `noUncheckedIndexedAccess`, `verbatimModuleSyntax`                                                             | Catches missing map lookups and other undefined values at compile time                                                                                                          |
| I2  | Tests on **Vitest**, not Jest (Tod, 2026-11-23)                                                                                          | Runs TypeScript and ESM natively, no `ts-jest` adapter, same `describe`/`it`/`expect` API                                                                                       |
| I3  | Native ESM: `"type": "module"`, `module`/`moduleResolution` `NodeNext`                                                                   | No CommonJS workaround needed once Jest is gone; relative imports carry `.js` extensions                                                                                        |
| I4  | Compile with `tsc` to `dist/` (`bin` → `dist/cli.js`); `dist/` gitignored and built by a `prepare` script                                | Plain JavaScript runs on any LTS Node, where running `.ts` directly needs Node ≥ 23.6 or a `tsx` dependency; npm runs `prepare` on `npm ci`, so one command installs and builds |
| I5  | `engines.node` `>=22`                                                                                                                    | Oldest LTS line still supported; Tod develops on Node 25                                                                                                                        |
| I6  | ESLint (flat config, `typescript-eslint` recommended, type-checked) + Prettier, with `eslint-config-prettier` so they don't fight        | Hygiene is graded; one `npm run lint` checks both                                                                                                                               |
| I7  | Two tsconfigs: `tsconfig.json` (src + tests, `noEmit`, for typecheck and the editor) and `tsconfig.build.json` (src only, emits `dist/`) | Tests stay out of the build                                                                                                                                                     |
| I8  | Plans in `docs/plans/` ship with the submission                                                                                          | They show the process                                                                                                                                                           |
| I9  | No runtime dependencies                                                                                                                  | One file argument or stdin doesn't justify an argument parser                                                                                                                   |
| I10 | `@types/node@22`, `lib` ES2024, `target` ES2022 (the `@tsconfig/node22` settings, without the dependency) (Tod)                          | Typecheck rejects Node APIs and built-ins newer than the Node 22 floor, though Tod develops on 25. Checked by the compiler only; no Node 22 test run                            |
| I11 | Tests in a separate `tests/` folder mirroring `src/` (Tod)                                                                               | Build config simply includes `src/`; the suite reads in one place                                                                                                               |

I9 was amended by architecture plan A21 (2026-11-24): no unnecessary runtime dependencies; dinero.js approved.

I4 and I10 are recorded together in the README's Design Tradeoffs section (step 6). The rest stay in this plan and AGENTS.md.

## Implementation steps (for the agent; Tod monitors)

0. Save two project memories (memory dir, plus MEMORY.md pointers): (a) output order of the report is
   undecided; the sample matches fills descending then name ascending; discuss with Tod before the app
   plan. (b) Deferred: the spec-sample acceptance test (built CLI as a child process, file argument and
   stdin, byte-for-byte, build before test) is the first step of the app plan; at submission, decide
   whether the zip ships git history (folder with `.git`) or not (`git archive -o submission.zip HEAD`).
1. **Ask Tod to approve the dev dependencies** and wait for his OK (AGENTS.md: no new dependencies without
   asking). Ask exactly: "OK to run `npm install -D typescript vitest @types/node@22 eslint @eslint/js
typescript-eslint prettier eslint-config-prettier`? Versions will be the current releases, locked in
   `package-lock.json`."
2. Copy this plan to `docs/plans/infrastructure.md`. Commit: `docs(plans): add infrastructure plan`.
3. Create `package.json`: `name`, `private: true`, `type: module`, `bin`, `engines`, and the scripts
   `build` (`tsc -p tsconfig.build.json`), `prepare` (`npm run build`), `typecheck` (`tsc --noEmit`),
   `lint` (`eslint . && prettier --check .`), `format` (`prettier --write .`), `test` (`vitest run`),
   `test:watch` (`vitest`), `check` (`npm run typecheck && npm run lint && npm test`), `start`
   (`node dist/cli.js`). Then run the approved install.
4. Add both tsconfigs (I1, I3, I7, I10, I11), `eslint.config.js`, `.prettierrc.json`, `.prettierignore` (`dist`,
   `node_modules`), and `dist/` in `.gitignore`. Add `src/cli.ts`, containing only a shebang and an empty
   `main`: `tsc` fails with no input files. Commit:
   `chore(tooling): set up typescript, vitest, eslint and prettier`.
5. **Docs.** In the README, fill in the factual sections: Requirements (Node ≥ 22), Installation
   (`npm ci`, with `npm run build` as the fallback for installs that skip scripts), Running Tests
   (`npm test`, `npm run check`). Usage waits for the app plan and shows `node dist/cli.js`, not
   `npm start`. Commit: `docs(readme): add setup`.
6. **README Design Tradeoffs: the build and the Node floor (I4, I10), one entry.** This is a reasoning section, so it is Tod's
   writing. Give Tod this draft in a plain code block, wait for his version, then commit it:
   `docs(readme): record build-to-dist tradeoff`.
   ```
   Compiled to JavaScript rather than run as TypeScript

   The CLI is compiled with tsc into dist/ and runs as plain JavaScript. Node can now run .ts files
   directly by stripping types, but only from 23.6, and the alternative, tsx, adds a runtime
   dependency for a small gain. Compiling keeps the requirement at any LTS Node (22+) with no extra
   runtime, and type errors stop the build instead of being stripped silently.

   dist/ is not committed. A prepare script builds it during npm ci, so installing and building is
   one command, and the repository holds only source.

   The cost is a build step: after editing src/ you rebuild before running the CLI by hand.

   The supported floor is Node 22, the oldest LTS line still maintained. It is developed on a newer
   Node, so the Node type definitions are pinned to version 22 and the compiler's built-in library
   to what Node 22 supports: using anything newer is a type error. That is checked by the compiler,
   not by running the tests on Node 22; for a tool that only uses fs, readline and process, I judged
   that enough.
   ```
7. **AGENTS.md.** Fill in Commands (`npm ci`, `npm run build`, `npm run check`, `npm run typecheck`,
   `npm run lint`, `npm test`, `node dist/cli.js <file>`), and add: "Build output is `dist/`, gitignored, built by
   `prepare`." "Tests use Vitest (chosen over Jest: native TypeScript and ESM)." "ESM with NodeNext:
   relative imports end in `.js`." Commit: `docs(agents): add commands and toolchain notes`.
8. **Close the plan.** Update `docs/plans/infrastructure.md` with what was done, the dependency versions
   installed, and anything still open. Commit: `docs(plans): close infrastructure plan`.

## Verification

- From a fresh `git clone` into the scratchpad: `npm ci` succeeds and creates `dist/cli.js`.
- `npm run typecheck` and `npm run lint` are clean.
- `npm start` runs the stub and exits 0.
- `npm test` starts Vitest. It reports no test files and exits non-zero, which is expected until the app
  plan adds the first test.

## Outcome (2026-11-23)

Done. All steps complete; verified from a fresh clone (`npm ci` builds `dist/cli.js`, typecheck and lint
clean, stub exits 0, `npm test` exits 1 with no test files as expected). A probe file confirmed the Node 22
pin: `RegExp.escape` (ES2025) fails typecheck, `Object.groupBy` (ES2024) passes.

Installed versions: typescript 6.0.3, vitest 4.1.12, @types/node 22.20.5, eslint 10.15.0, @eslint/js 10.0.1,
typescript-eslint 8.74.0, prettier 3.10.1, eslint-config-prettier 10.1.8.

Changes from the plan:

- The README tradeoff entry is Tod's short bullet list, not the drafted paragraphs.
- `.gitignore` also ignores `node_modules/`; `.prettierignore` also skips `package-lock.json` and the brief.

Still open, outside this plan: the report's output order, and whether the submission zip ships git history.
