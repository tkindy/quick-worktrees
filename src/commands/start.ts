import { resolve, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { homedir } from "node:os";
import { getRepoRoot, getRepoName, listWorktrees, branchExists, checkoutNewBranch, checkoutBranch, createWorktree } from "../lib/git.js";
import { generateRandomWord } from "../lib/names.js";
import { loadConfig } from "../lib/config.js";
import { copyPaths } from "../lib/copy.js";
import { openInNewWindow } from "../lib/iterm.js";
import { setCachedWindowId } from "../lib/cache.js";

function reuseWorktree(
  worktreePath: string,
  ref: string | undefined,
  existing: boolean | undefined,
  customName: string | undefined,
): string {
  const worktreeName = worktreePath.split("/").pop()!;
  const startPoint = ref ?? execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();

  const MAX_ATTEMPTS = 5;
  let branchName = "";
  let attempts = 0;

  if (existing) {
    branchName = ref!;
  } else if (customName) {
    branchName = customName;
  } else {
    do {
      branchName = generateRandomWord();
      if (!branchExists(branchName)) break;
      attempts++;
    } while (attempts < MAX_ATTEMPTS);

    if (attempts >= MAX_ATTEMPTS) {
      console.error(`Error: Could not find an available branch name after ${MAX_ATTEMPTS} attempts.`);
      console.error("Try specifying a custom branch name with --branch-name.");
      process.exit(1);
    }
  }

  const refInfo = ref ? ` from ${ref}` : "";
  console.log(`Reusing worktree: ${worktreeName}${refInfo}`);

  if (existing) {
    checkoutBranch(worktreePath, branchName);
  } else {
    checkoutNewBranch(worktreePath, branchName, startPoint);
  }

  return worktreePath;
}

function makeNewWorktree(
  repoName: string,
  parentDir: string,
  ref: string | undefined,
  existing: boolean | undefined,
  customName: string | undefined,
): string {
  const MAX_ATTEMPTS = 5;
  let word = "";
  let branchName = "";
  let worktreeName = "";
  let worktreePath = "";
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
  mkdirSync(parentDir, { recursive: true });
  createWorktree(worktreePath, branchName, ref, existing);

  return worktreePath;
}

export function start(ref?: string, options?: { existing?: boolean; branchName?: string }): void {
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
  const parentDir = join(homedir(), ".wt", "worktrees", repoName);

  const worktrees = listWorktrees();
  const available = worktrees.find(
    (wt) => wt.branch === null && wt.path.startsWith(parentDir + "/")
  );

  const worktreePath = available
    ? reuseWorktree(available.path, ref, existing, customName)
    : makeNewWorktree(repoName, parentDir, ref, existing, customName);

  const config = loadConfig();

  if (config?.copyPaths?.length) {
    copyPaths(repoRoot, worktreePath, config.copyPaths);
  }

  const setupScript = config?.scripts?.setup;

  console.log(`Opening iTerm window in: ${worktreePath}`);
  const windowId = openInNewWindow(worktreePath, setupScript);
  if (windowId !== null) {
    setCachedWindowId(worktreePath, windowId);
  }
}
