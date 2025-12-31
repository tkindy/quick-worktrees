import { resolve, dirname } from "node:path";
import { getRepoRoot, getRepoName, createWorktree } from "../lib/git.js";
import { generateRandomWord } from "../lib/names.js";
import { loadConfig } from "../lib/config.js";
import { openInNewWindow } from "../lib/iterm.js";

export function create(ref?: string): void {
  const repoRoot = getRepoRoot();
  const repoName = getRepoName();
  const word = generateRandomWord();

  const worktreeName = `${repoName}-${word}`;
  const parentDir = dirname(repoRoot);
  const worktreePath = resolve(parentDir, worktreeName);

  const refInfo = ref ? ` from ${ref}` : "";
  console.log(`Creating worktree: ${worktreeName}${refInfo}`);
  createWorktree(worktreePath, ref);

  const config = loadConfig();
  const setupScript = config?.scripts?.setup;

  console.log(`Opening new iTerm window in: ${worktreePath}`);
  openInNewWindow(worktreePath, setupScript);
}
