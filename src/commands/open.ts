import { basename, join } from "node:path";
import { homedir } from "node:os";
import { getMainRepoName, listWorktrees } from "../lib/git.js";
import { focusOrOpenWorktree } from "../lib/iterm.js";

export function open(name: string): void {
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

  focusOrOpenWorktree(worktree.path);
}
