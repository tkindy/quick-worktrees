import { resolve, dirname } from "node:path";
import { getRepoRoot, getRepoName, createWorktree } from "../lib/git.js";
import { generateRandomWord } from "../lib/names.js";
import { loadConfig } from "../lib/config.js";
import { runSetupScript } from "../lib/shell.js";

export function create(): void {
  const repoRoot = getRepoRoot();
  const repoName = getRepoName();
  const word = generateRandomWord();

  const worktreeName = `${repoName}-${word}`;
  const parentDir = dirname(repoRoot);
  const worktreePath = resolve(parentDir, worktreeName);

  console.log(`Creating worktree: ${worktreeName}`);
  createWorktree(worktreePath);

  const config = loadConfig();
  if (config?.scripts?.setup) {
    console.log(`Running setup script...`);
    runSetupScript(config.scripts.setup, worktreePath);
  }

  console.log(`\nWorktree created at: ${worktreePath}`);
  console.log(`\nTo enter the worktree:\n  cd ${worktreePath}`);
}
