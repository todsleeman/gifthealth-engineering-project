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

- Compiled to JavaScript rather than run as TypeScript
  - Runs on Node 22 with nothing extra installed. Running .ts directly needs Node 23.6 or tsx.
  - The build catches type errors. Node's type stripping doesn't check them.
  - npm ci builds dist/, so it isn't committed. The cost is a rebuild after each change.
- Node 22 checked by the compiler, not by a test run
  - Node types and the compiler's built-in library are pinned to Node 22, so code using anything added after Node 22 won't typecheck.
  - The tests haven't been run on Node 22 itself. The CLI only uses fs, readline and process.

## Testing Strategy

## Error Handling and Edge Cases

## Future Improvements
