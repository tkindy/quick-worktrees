import { execSync } from "node:child_process";
import { getRepoRoot } from "../lib/git.js";
import { loadConfig } from "../lib/config.js";

export function refresh(): void {
  const config = loadConfig();
  const setupScript = config?.scripts?.setup;

  if (!setupScript) {
    console.error("Error: No setup script configured in wt.json");
    process.exit(1);
  }

  const worktreePath = getRepoRoot();
  console.log(`Running setup script in: ${worktreePath}`);
  execSync(`/bin/bash -c ${JSON.stringify(setupScript)}`, {
    cwd: worktreePath,
    stdio: "inherit",
  });
}
