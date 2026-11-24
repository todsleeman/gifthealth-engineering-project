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

## Architecture and Design

### Data Flow

### Data Structures

### Code Organization

## Assumptions

## Design Tradeoffs

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

## Future Improvements

- **HTTP API.** The core logic is separate from the CLI, so it could sit behind an HTTP API without changes.
