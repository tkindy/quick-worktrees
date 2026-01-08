import { resolve, dirname } from "node:path";
import { getRepoRoot, getRepoName, createWorktree } from "../lib/git.js";
import { generateRandomWord } from "../lib/names.js";
import { loadConfig } from "../lib/config.js";
import { copyPaths } from "../lib/copy.js";
import { openInNewWindow } from "../lib/iterm.js";

export function newWorktree(ref?: string, options?: { existing?: boolean; branchName?: string }): void {
  const existing = options?.existing;
  const customName = options?.branchName;

  if (existing && !ref) {
    console.error("Error: --existing requires a branch name");
    process.exit(1);
  }

  if (existing && customName) {
    console.error("Error: --existing and --branch-name are mutually exclusive");
    process.exit(1);
  }

  const repoRoot = getRepoRoot();
  const repoName = getRepoName();
  const word = generateRandomWord();
  const branchName = customName ?? word;

  const worktreeName = `${repoName}-${word}`;
  const parentDir = dirname(repoRoot);
  const worktreePath = resolve(parentDir, worktreeName);

  const refInfo = ref ? ` from ${ref}` : "";
  console.log(`Creating worktree: ${worktreeName}${refInfo}`);
  createWorktree(worktreePath, branchName, ref, existing);

  const config = loadConfig();

  if (config?.copyPaths?.length) {
    copyPaths(repoRoot, worktreePath, config.copyPaths);
  }

  const setupScript = config?.scripts?.setup;

  console.log(`Opening new iTerm window in: ${worktreePath}`);
  openInNewWindow(worktreePath, setupScript);
}
