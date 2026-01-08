import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { getRepoRoot, getRepoName, createWorktree, branchExists } from "../lib/git.js";
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
  const parentDir = dirname(repoRoot);

  const MAX_ATTEMPTS = 5;
  let word: string = "";
  let branchName: string = "";
  let worktreeName: string = "";
  let worktreePath: string = "";
  let attempts = 0;

  do {
    word = generateRandomWord();
    branchName = existing ? ref! : (customName ?? word);
    worktreeName = `${repoName}-${word}`;
    worktreePath = resolve(parentDir, worktreeName);

    const dirExists = existsSync(worktreePath);
    const branchAlreadyExists = !existing && !customName && branchExists(branchName);

    if (!dirExists && !branchAlreadyExists) {
      break;
    }

    attempts++;
  } while (attempts < MAX_ATTEMPTS);

  if (attempts >= MAX_ATTEMPTS) {
    console.error(`Error: Could not find an available worktree name after ${MAX_ATTEMPTS} attempts.`);
    console.error("Try specifying a custom branch name with --branch-name.");
    process.exit(1);
  }

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
