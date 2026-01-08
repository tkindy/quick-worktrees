import { getWorktreeByBranch } from "../lib/git.js";
import { loadConfig } from "../lib/config.js";
import { openInNewWindow } from "../lib/iterm.js";

export function open(branch: string): void {
  const worktree = getWorktreeByBranch(branch);

  if (!worktree) {
    console.error(`Error: No worktree found for branch '${branch}'`);
    process.exit(1);
  }

  const config = loadConfig();
  const setupScript = config?.scripts?.setup;

  console.log(`Opening iTerm window in: ${worktree.path}`);
  openInNewWindow(worktree.path, setupScript);
}
