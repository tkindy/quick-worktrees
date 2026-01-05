import { execSync } from "node:child_process";
import { basename } from "node:path";

export function getRepoRoot(): string {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
}

export function getRepoName(): string {
  const root = getRepoRoot();
  return basename(root);
}

export function createWorktree(path: string, branchName: string, ref?: string): void {
  const refArg = ref ? ` "${ref}"` : "";
  execSync(`git worktree add -b "${branchName}" "${path}"${refArg}`, { stdio: "inherit" });
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
