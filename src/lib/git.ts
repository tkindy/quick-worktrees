import { execSync } from "node:child_process";
import { basename } from "node:path";

export function getRepoRoot(): string {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
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

export function isWorktree(): boolean {
  const gitDir = execSync("git rev-parse --git-dir", { encoding: "utf-8" }).trim();
  return gitDir.includes(".git/worktrees");
}

export function hasUncommittedChanges(): boolean {
  const status = execSync("git status --porcelain", { encoding: "utf-8" });
  return status.trim().length > 0;
}

export function getCurrentBranch(): string | null {
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
  return branch === "HEAD" ? null : branch;
}

export function detachHead(): void {
  execSync("git checkout --detach", { stdio: "inherit" });
}

export function deleteBranch(branchName: string, mainWorktreePath: string): void {
  execSync(`git branch -D "${branchName}"`, { cwd: mainWorktreePath, stdio: "inherit" });
}

export function getMainWorktreePath(): string {
  const output = execSync("git worktree list --porcelain", { encoding: "utf-8" });
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
