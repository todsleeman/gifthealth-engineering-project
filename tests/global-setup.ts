import { execFileSync } from "node:child_process";

/** Builds `dist/` once before any test, so the acceptance tests never run a stale CLI. */
export default function setup(): void {
  execFileSync("npm", ["run", "build", "--silent"], { stdio: "inherit" });
}
