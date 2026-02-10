import { basename, join } from "node:path";
import { homedir } from "node:os";
import { getMainRepoName, listWorktrees } from "../lib/git.js";

export function list(): void {
  const repoName = getMainRepoName();
  const parentDir = join(homedir(), ".wt", "worktrees", repoName);

  const worktrees = listWorktrees().filter(
    (wt) => wt.path.startsWith(parentDir + "/")
  );

  if (worktrees.length === 0) {
    console.log("No worktrees found for this repo.");
    return;
  }

  const active = worktrees.filter((wt) => wt.branch !== null);
  const available = worktrees.filter((wt) => wt.branch === null);
  const all = [...active, ...available];

  const names = all.map((wt) => basename(wt.path));
  const maxLen = Math.max(...names.map((n) => n.length));

  for (let i = 0; i < all.length; i++) {
    if (i === active.length && active.length > 0) console.log();
    const status = all[i].branch ?? "(available)";
    console.log(`${names[i].padEnd(maxLen)}  ${status}`);
  }
}
