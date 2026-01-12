import { getWorktreeByBranch } from "../lib/git.js";
import { focusWindowById, openInNewWindow } from "../lib/iterm.js";
import { getCachedWindowId, setCachedWindowId, removeCachedWindow } from "../lib/cache.js";

export function open(branch: string): void {
  const worktree = getWorktreeByBranch(branch);

  if (!worktree) {
    console.error(`Error: No worktree found for branch '${branch}'`);
    process.exit(1);
  }

  const cachedWindowId = getCachedWindowId(worktree.path);

  if (cachedWindowId !== null && focusWindowById(cachedWindowId)) {
    console.log(`Focused existing iTerm window for: ${worktree.path}`);
    return;
  }

  if (cachedWindowId !== null) {
    removeCachedWindow(worktree.path);
  }

  console.log(`Opening new iTerm window in: ${worktree.path}`);
  const windowId = openInNewWindow(worktree.path);
  if (windowId !== null) {
    setCachedWindowId(worktree.path, windowId);
  }
}
