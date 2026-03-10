import { basename, join } from "node:path";
import { homedir } from "node:os";
import { getRepoRoot, isWorktree, hasUncommittedChanges, getCurrentBranch, getMainWorktreePath, getMainRepoName, deleteBranch, detachHead, resetWorktree, listWorktrees } from "../lib/git.js";
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

function resolveWorktreePath(name: string): string {
  const repoName = getMainRepoName();
  const parentDir = join(homedir(), ".wt", "worktrees", repoName);

  const worktrees = listWorktrees().filter(
    (wt) => wt.path.startsWith(parentDir + "/")
  );

  const worktree = worktrees.find(
    (wt) => wt.branch === name || basename(wt.path) === name
  );

  if (!worktree) {
    console.error(`Error: No worktree found matching '${name}'`);
    process.exit(1);
  }

  return worktree.path;
}

export async function finish(name?: string): Promise<void> {
  const remote = name !== undefined;
  const worktreePath = remote ? resolveWorktreePath(name) : getRepoRoot();

  if (!isWorktree(worktreePath)) {
    console.error("Error: Current directory is not a git worktree");
    process.exit(1);
  }

  if (hasUncommittedChanges(worktreePath)) {
    const confirmed = await confirm("Worktree has uncommitted changes. Discard them?");
    if (!confirmed) {
      console.log("Aborted");
      return;
    }
  }

  const branch = getCurrentBranch(worktreePath);
  const mainWorktreePath = getMainWorktreePath(worktreePath);

  if (branch) {
    detachHead(worktreePath);

    const deleteBranchConfirmed = await confirm(`Delete branch '${branch}'?`);
    if (deleteBranchConfirmed) {
      deleteBranch(branch, mainWorktreePath);
      console.log(`Branch '${branch}' deleted`);
    }
  }

  resetWorktree(worktreePath);
  console.log("Worktree cleaned up and ready for reuse");

  removeCachedWindow(worktreePath);

  if (!remote && process.env.ITERM_SESSION_ID) {
    await waitForKey("Press any key to close this window...");
    closeCurrentWindow();
  }
}
