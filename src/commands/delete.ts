import { execSync } from "node:child_process";
import { getRepoRoot, isWorktree, removeWorktree, hasUncommittedChanges, getCurrentBranch, getMainWorktreePath, deleteBranch } from "../lib/git.js";
import { closeCurrentWindow } from "../lib/iterm.js";

function hasWebStormOpen(path: string): boolean {
  try {
    const result = execSync(`lsof -c webstorm 2>/dev/null | grep "${path}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return result.trim().length > 0;
  } catch {
    // grep returns exit code 1 when no matches found
    return false;
  }
}

function waitForKey(message: string): Promise<void> {
  return new Promise((resolve) => {
    process.stdout.write(message);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once("data", () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      console.log();
      resolve();
    });
  });
}

function confirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write(`${message} (y/N) `);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once("data", (data) => {
      const char = data.toString().toLowerCase();
      process.stdin.setRawMode(false);
      process.stdin.pause();
      console.log(char);
      resolve(char === "y");
    });
  });
}

export async function deleteWorktree(): Promise<void> {
  if (!isWorktree()) {
    console.error("Error: Current directory is not a git worktree");
    process.exit(1);
  }

  if (hasUncommittedChanges()) {
    const confirmed = await confirm("Worktree has uncommitted changes. Delete anyway?");
    if (!confirmed) {
      console.log("Aborted");
      return;
    }
  }

  const worktreePath = getRepoRoot();

  if (hasWebStormOpen(worktreePath)) {
    const confirmed = await confirm("WebStorm appears to have this worktree open. Delete anyway?");
    if (!confirmed) {
      console.log("Aborted");
      return;
    }
  }
  const branch = getCurrentBranch();
  const mainWorktreePath = getMainWorktreePath();

  console.log(`Removing worktree: ${worktreePath}`);
  removeWorktree(worktreePath);
  console.log("Worktree removed successfully");

  if (branch) {
    const deleteBranchConfirmed = await confirm(`Delete branch '${branch}' as well?`);
    if (deleteBranchConfirmed) {
      deleteBranch(branch, mainWorktreePath);
      console.log(`Branch '${branch}' deleted`);
    }
  }

  if (process.env.ITERM_SESSION_ID) {
    await waitForKey("Press any key to close this window...");
    closeCurrentWindow();
  }
}
