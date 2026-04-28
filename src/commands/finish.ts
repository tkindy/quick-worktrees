import { basename, join } from "node:path";
import { homedir } from "node:os";
import { getRepoRoot, isWorktree, hasUncommittedChanges, getCurrentBranch, getMainWorktreePath, getMainRepoName, deleteBranch, detachHead, resetWorktree, listWorktrees, isGraphiteManaged, getDefaultBranch, branchHasCommitsBeyond } from "../lib/git.js";
import { closeCurrentWindow } from "../lib/iterm.js";
import { removeCachedWindow } from "../lib/cache.js";
import { loadConfig } from "../lib/config.js";
import {
  getConfigDiffStat,
  runPatchApprovalFlow,
  cleanupTmpDir,
} from "../lib/config-diff.js";

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

async function decideBranchDeletion(
  branch: string,
  mainWorktreePath: string,
  force: boolean,
  keepBranch: boolean,
): Promise<boolean> {
  if (force) return true;
  if (keepBranch) return false;

  if (isGraphiteManaged(branch, mainWorktreePath)) {
    console.log(`Keeping Graphite-managed branch '${branch}'`);
    return false;
  }

  const defaultBranch = getDefaultBranch(mainWorktreePath);
  if (
    defaultBranch &&
    !branchHasCommitsBeyond(branch, defaultBranch, mainWorktreePath)
  ) {
    console.log(
      `Branch '${branch}' has no new commits beyond '${defaultBranch}', deleting`,
    );
    return true;
  }

  return confirm(`Delete branch '${branch}'?`);
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

export async function finish(
  name?: string,
  options?: { force?: boolean; keepBranch?: boolean },
): Promise<void> {
  const force = options?.force ?? false;
  const keepBranch = options?.keepBranch ?? false;

  if (force && keepBranch) {
    console.error("Error: --force and --keep-branch are mutually exclusive");
    process.exit(1);
  }

  const remote = name !== undefined;
  const worktreePath = remote ? resolveWorktreePath(name) : getRepoRoot();

  if (!isWorktree(worktreePath)) {
    console.error("Error: Current directory is not a git worktree");
    process.exit(1);
  }

  if (hasUncommittedChanges(worktreePath)) {
    if (force) {
      console.log("Discarding uncommitted changes");
    } else {
      const confirmed = await confirm("Worktree has uncommitted changes. Discard them?");
      if (!confirmed) {
        console.log("Aborted");
        return;
      }
    }
  }

  const mainWorktreePath = getMainWorktreePath(worktreePath);

  if (!force) {
    const config = loadConfig();
    if (config?.copyPaths?.length) {
      const result = getConfigDiffStat(
        mainWorktreePath,
        worktreePath,
        config.copyPaths
      );
      if (result) {
        const { tmpDir, diffStat, hasConflicts } = result;
        try {
          console.log("\nConfig changes detected:\n");
          console.log(diffStat);
          if (hasConflicts) {
            console.log("Note: Conflicts with main worktree config detected");
          }
          const mergeConfirmed = await confirm(
            "Merge config changes back to main worktree?"
          );
          if (mergeConfirmed) {
            runPatchApprovalFlow(tmpDir, mainWorktreePath, hasConflicts);
          }
        } finally {
          cleanupTmpDir(tmpDir);
        }
      }
    }
  }

  const branch = getCurrentBranch(worktreePath);

  if (branch) {
    detachHead(worktreePath);

    const shouldDelete = await decideBranchDeletion(
      branch,
      mainWorktreePath,
      force,
      keepBranch,
    );
    if (shouldDelete) {
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
