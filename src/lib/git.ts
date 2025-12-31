import { execSync } from "node:child_process";
import { basename } from "node:path";

export function getRepoRoot(): string {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
}

export function getRepoName(): string {
  const root = getRepoRoot();
  return basename(root);
}

export function createWorktree(path: string, ref?: string): void {
  const refArg = ref ? ` "${ref}"` : "";
  execSync(`git worktree add --detach "${path}"${refArg}`, { stdio: "inherit" });
}
