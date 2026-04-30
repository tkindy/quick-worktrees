import { basename, join } from "node:path";
import { homedir } from "node:os";
import { getMainRepoName, isWorktreeAvailable, listWorktrees } from "../lib/git.js";

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

  const annotated = worktrees.map((wt) => ({
    ...wt,
    available: isWorktreeAvailable(wt.path),
  }));

  const active = annotated.filter((wt) => !wt.available);
  const available = annotated.filter((wt) => wt.available);
  const all = [...active, ...available];

  const names = all.map((wt) => basename(wt.path));
  const maxNameLen = Math.max(...names.map((n) => n.length));
  const maxStatusLen = Math.max("available".length, "in use".length);

  for (let i = 0; i < all.length; i++) {
    if (i === active.length && active.length > 0) console.log();
    const wt = all[i];
    const status = wt.available ? "available" : "in use";
    const ref = wt.available ? "" : `  ${wt.branch ?? "detached"}`;
    console.log(`${names[i].padEnd(maxNameLen)}  ${status.padEnd(maxStatusLen)}${ref}`);
  }
}
