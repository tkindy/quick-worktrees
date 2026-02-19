import { getRepoRoot, isWorktree, hasUncommittedChanges, getCurrentBranch, getMainWorktreePath, deleteBranch, detachHead, resetWorktree } from "../lib/git.js";
import { closeCurrentWindow } from "../lib/iterm.js";
import { removeCachedWindow } from "../lib/cache.js";

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

export async function finish(): Promise<void> {
  if (!isWorktree()) {
    console.error("Error: Current directory is not a git worktree");
    process.exit(1);
  }

  if (hasUncommittedChanges()) {
    const confirmed = await confirm("Worktree has uncommitted changes. Discard them?");
    if (!confirmed) {
      console.log("Aborted");
      return;
    }
  }

  const worktreePath = getRepoRoot();
  const branch = getCurrentBranch();
  const mainWorktreePath = getMainWorktreePath();

  if (branch) {
    detachHead();

    const deleteBranchConfirmed = await confirm(`Delete branch '${branch}'?`);
    if (deleteBranchConfirmed) {
      deleteBranch(branch, mainWorktreePath);
      console.log(`Branch '${branch}' deleted`);
    }
  }

  resetWorktree(worktreePath);
  console.log("Worktree cleaned up and ready for reuse");

  removeCachedWindow(worktreePath);

  if (process.env.ITERM_SESSION_ID) {
    await waitForKey("Press any key to close this window...");
    closeCurrentWindow();
  }
}
