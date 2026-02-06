import { execSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { getRepoRoot, getRepoName, listWorktrees, branchExists, checkoutNewBranch, checkoutBranch } from "../lib/git.js";
import { generateRandomWord } from "../lib/names.js";
import { loadConfig } from "../lib/config.js";
import { copyPaths } from "../lib/copy.js";
import { openInNewWindow } from "../lib/iterm.js";
import { setCachedWindowId } from "../lib/cache.js";
import { newWorktree } from "./new.js";

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

  if (!available) {
    newWorktree(ref, options);
    return;
  }

  const worktreePath = available.path;
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
