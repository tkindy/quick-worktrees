import { execSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import type { CopyPathEntry } from "../types.js";
import { copyPaths } from "./copy.js";

function removeNestedGitignores(dir: string): void {
  execSync(
    'find . -path ./.git -prune -o -name .gitignore -type f -exec rm {} +',
    { cwd: dir, stdio: "ignore" }
  );
}

function createConfigDiffRepo(
  mainPath: string,
  worktreePath: string,
  paths: (string | CopyPathEntry)[],
): { tmpDir: string; hasChanges: boolean } {
  const tmpDir = mkdtempSync(join(tmpdir(), "wt-merge-config-"));

  execSync("git init -q", { cwd: tmpDir, stdio: "ignore" });
  execSync('git config user.email "wt"', { cwd: tmpDir, stdio: "ignore" });
  execSync('git config user.name "wt"', { cwd: tmpDir, stdio: "ignore" });
  execSync("git config core.excludesFile /dev/null", {
    cwd: tmpDir,
    stdio: "ignore",
  });

  copyPaths(mainPath, tmpDir, paths, { quiet: true });

  removeNestedGitignores(tmpDir);
  execSync("git add -A", { cwd: tmpDir, stdio: "ignore" });
  execSync('git commit -q -m "base" --allow-empty', {
    cwd: tmpDir,
    stdio: "ignore",
  });

  for (const entry of paths) {
    const p = typeof entry === "string" ? entry : entry.path;
    const dest = join(tmpDir, p);
    if (existsSync(dest)) {
      rmSync(dest, { recursive: true, force: true });
    }
  }
  copyPaths(worktreePath, tmpDir, paths, { quiet: true });

  removeNestedGitignores(tmpDir);

  const status = execSync("git status --porcelain", {
    cwd: tmpDir,
    encoding: "utf-8",
  });

  return { tmpDir, hasChanges: !!status.trim() };
}

export function getConfigDiffStat(
  mainPath: string,
  worktreePath: string,
  paths: (string | CopyPathEntry)[],
): { tmpDir: string; diffStat: string } | null {
  const { tmpDir, hasChanges } = createConfigDiffRepo(
    mainPath,
    worktreePath,
    paths,
  );

  if (!hasChanges) {
    rmSync(tmpDir, { recursive: true, force: true });
    return null;
  }

  execSync("git add -N .", { cwd: tmpDir, stdio: "ignore" });
  const diffStat = execSync("git diff --stat", {
    cwd: tmpDir,
    encoding: "utf-8",
  });

  return { tmpDir, diffStat };
}

export function runPatchApprovalFlow(
  tmpDir: string,
  mainPath: string
): number {
  spawnSync("git", ["add", "-p"], { cwd: tmpDir, stdio: "inherit" });

  const stagedStatus = execSync("git diff --cached --name-status", {
    cwd: tmpDir,
    encoding: "utf-8",
  }).trim();

  if (!stagedStatus) {
    console.log("No changes selected");
    return 0;
  }

  let applied = 0;
  for (const line of stagedStatus.split("\n")) {
    const [status, file] = line.split("\t");
    const destPath = join(mainPath, file);

    if (status === "D") {
      if (existsSync(destPath)) {
        unlinkSync(destPath);
        applied++;
        console.log(`  Deleted: ${file}`);
      }
    } else {
      const content = execSync(`git show ":${file}"`, { cwd: tmpDir });
      mkdirSync(dirname(destPath), { recursive: true });
      writeFileSync(destPath, content);
      applied++;
      console.log(`  Updated: ${file}`);
    }
  }

  if (applied > 0) {
    console.log(`\nMerged ${applied} file(s) to main repo`);
  }

  return applied;
}

export function cleanupTmpDir(tmpDir: string): void {
  rmSync(tmpDir, { recursive: true, force: true });
}
