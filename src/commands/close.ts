import { getRepoRoot } from "../lib/git.js";
import { closeCurrentWindow } from "../lib/iterm.js";
import { removeCachedWindow } from "../lib/cache.js";

export function close(): void {
  if (!process.env.ITERM_SESSION_ID) {
    console.error("Error: Not running in an iTerm session");
    process.exit(1);
  }

  try {
    const worktreePath = getRepoRoot();
    removeCachedWindow(worktreePath);
  } catch {
    // Not in a git repo, just close the window
  }

  closeCurrentWindow();
}
