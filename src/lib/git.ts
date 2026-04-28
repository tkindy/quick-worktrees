import { execSync } from "node:child_process";
import { basename } from "node:path";

export function getRepoRoot(cwd?: string): string {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf-8", cwd }).trim();
}

export function getRepoName(): string {
  const root = getRepoRoot();
  return basename(root);
}

export function getMainRepoName(): string {
  return basename(getMainWorktreePath());
}

export function createWorktree(path: string, branchName: string, ref?: string, existing?: boolean): void {
  if (existing) {
    execSync(`git worktree add "${path}" "${ref}"`, { stdio: "inherit" });
  } else {
    const refArg = ref ? ` "${ref}"` : "";
    execSync(`git worktree add -b "${branchName}" "${path}"${refArg}`, { stdio: "inherit" });
  }
}

export function isWorktree(cwd?: string): boolean {
  const gitDir = execSync("git rev-parse --git-dir", { encoding: "utf-8", cwd }).trim();
  return gitDir.includes(".git/worktrees");
}

export function hasUncommittedChanges(cwd?: string): boolean {
  const status = execSync("git status --porcelain", { encoding: "utf-8", cwd });
  return status.trim().length > 0;
}

export function getCurrentBranch(cwd?: string): string | null {
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8", cwd }).trim();
  return branch === "HEAD" ? null : branch;
}

export function detachHead(cwd?: string): void {
  execSync("git checkout --detach", { stdio: "inherit", cwd });
}

export function deleteBranch(branchName: string, mainWorktreePath: string): void {
  execSync(`git branch -D "${branchName}"`, { cwd: mainWorktreePath, stdio: "inherit" });
}

export function getMainWorktreePath(cwd?: string): string {
  const output = execSync("git worktree list --porcelain", { encoding: "utf-8", cwd });
  const firstLine = output.split("\n")[0];
  return firstLine.replace("worktree ", "");
}

export interface Worktree {
  path: string;
  branch: string | null;
}

export function listWorktrees(): Worktree[] {
  const output = execSync("git worktree list --porcelain", { encoding: "utf-8" });
  const worktrees: Worktree[] = [];
  let current: Partial<Worktree> = {};

  for (const line of output.split("\n")) {
    if (line.startsWith("worktree ")) {
      current.path = line.replace("worktree ", "");
    } else if (line.startsWith("branch ")) {
      current.branch = line.replace("branch refs/heads/", "");
    } else if (line === "") {
      if (current.path) {
        worktrees.push({ path: current.path, branch: current.branch ?? null });
      }
      current = {};
    }
  }

  return worktrees;
}

export function getWorktreeByBranch(branch: string): Worktree | undefined {
  return listWorktrees().find((wt) => wt.branch === branch);
}

export function branchExists(branchName: string): boolean {
  try {
    execSync(`git rev-parse --verify "refs/heads/${branchName}"`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function findRemoteBranch(branchName: string): string | null {
  const output = execSync(
    `git for-each-ref --format="%(refname:short)" "refs/remotes/*/${branchName}"`,
    { encoding: "utf-8" },
  ).trim();
  if (!output) return null;
  const matches = output.split("\n").filter((line) => line.endsWith(`/${branchName}`));
  if (matches.length !== 1) return null;
  return matches[0];
}

export function createTrackingBranch(branchName: string, remoteBranch: string): void {
  execSync(`git branch --track "${branchName}" "${remoteBranch}"`, { stdio: "inherit" });
}

export function checkoutNewBranch(worktreePath: string, branchName: string, startPoint: string): void {
  execSync(`git checkout -b "${branchName}" "${startPoint}"`, { cwd: worktreePath, stdio: "inherit" });
}

export function checkoutBranch(worktreePath: string, branchName: string): void {
  execSync(`git checkout "${branchName}"`, { cwd: worktreePath, stdio: "inherit" });
}

export function resetWorktree(worktreePath: string): void {
  execSync("git reset --hard", { cwd: worktreePath, stdio: "inherit" });
  execSync("git clean -fd", { cwd: worktreePath, stdio: "inherit" });
}

export function isGraphiteManaged(branch: string, cwd?: string): boolean {
  try {
    execSync(`gt info "${branch}"`, {
      stdio: "ignore",
      cwd,
    });
    return true;
  } catch {
    return false;
  }
}

export function getDefaultBranch(cwd?: string): string | null {
  try {
    const ref = execSync("git symbolic-ref --short refs/remotes/origin/HEAD", {
      encoding: "utf-8",
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (ref.startsWith("origin/")) return ref.slice("origin/".length);
  } catch {}

  for (const candidate of ["main", "master"]) {
    try {
      execSync(`git rev-parse --verify "refs/heads/${candidate}"`, {
        stdio: "ignore",
        cwd,
      });
      return candidate;
    } catch {}
  }

  return null;
}

export function branchHasCommitsBeyond(
  branch: string,
  baseBranch: string,
  cwd?: string,
): boolean {
  const count = execSync(
    `git rev-list --count "${baseBranch}..${branch}"`,
    { encoding: "utf-8", cwd },
  ).trim();
  return parseInt(count, 10) > 0;
}
