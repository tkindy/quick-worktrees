import { execSync } from "node:child_process";
import { basename } from "node:path";

export function getRepoRoot(): string {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
}

export function getRepoName(): string {
  const root = getRepoRoot();
  return basename(root);
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

export function removeWorktree(worktreePath: string): void {
  execSync(`git worktree remove "${worktreePath}" --force`, { stdio: "inherit" });
}

export function hasUncommittedChanges(): boolean {
  const status = execSync("git status --porcelain", { encoding: "utf-8" });
  return status.trim().length > 0;
}

export function getCurrentBranch(): string | null {
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
  return branch === "HEAD" ? null : branch;
}

export function deleteBranch(branchName: string, mainWorktreePath: string): void {
  execSync(`git branch -D "${branchName}"`, { cwd: mainWorktreePath, stdio: "inherit" });
}

export function getMainWorktreePath(): string {
  const output = execSync("git worktree list --porcelain", { encoding: "utf-8" });
  const firstLine = output.split("\n")[0];
  return firstLine.replace("worktree ", "");
}
