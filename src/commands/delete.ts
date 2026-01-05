import { execSync } from "node:child_process";
import { getRepoRoot, isWorktree, removeWorktree, hasUncommittedChanges, getCurrentBranch, getMainWorktreePath, deleteBranch } from "../lib/git.js";

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

function closeItermSession(): void {
  const sessionId = process.env.ITERM_SESSION_ID;
  if (!sessionId) return;

  // ITERM_SESSION_ID format is "w0t0p0:UUID", we need just the UUID
  const uuid = sessionId.split(":")[1];
  if (!uuid) return;

  const script = `
    tell application "iTerm2"
      repeat with aWindow in windows
        tell aWindow
          repeat with aTab in tabs
            tell aTab
              repeat with aSession in sessions
                if unique ID of aSession is "${uuid}" then
                  close aSession
                  return
                end if
              end repeat
            end tell
          end repeat
        end tell
      end repeat
    end tell
  `;

  try {
    execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
      stdio: "ignore",
    });
  } catch {
    // Ignore errors - session may already be closed
  }
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
    await waitForKey("Press any key to close this session...");
    closeItermSession();
  }
}
