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
import { getConfigBasePath } from "./config-base.js";

function removeNestedGitignores(dir: string): void {
  execSync(
    'find . -path ./.git -prune -o -name .gitignore -type f -exec rm {} +',
    { cwd: dir, stdio: "ignore" }
  );
}

function initTmpRepo(tmpDir: string): void {
  execSync("git init -q -b main", { cwd: tmpDir, stdio: "ignore" });
  execSync('git config user.email "wt"', { cwd: tmpDir, stdio: "ignore" });
  execSync('git config user.name "wt"', { cwd: tmpDir, stdio: "ignore" });
  execSync("git config core.excludesFile /dev/null", {
    cwd: tmpDir,
    stdio: "ignore",
  });
}

function commitAll(tmpDir: string, message: string): void {
  removeNestedGitignores(tmpDir);
  execSync("git add -A", { cwd: tmpDir, stdio: "ignore" });
  execSync(`git commit -q -m ${JSON.stringify(message)} --allow-empty`, {
    cwd: tmpDir,
    stdio: "ignore",
  });
}

function clearPaths(
  tmpDir: string,
  paths: (string | CopyPathEntry)[],
): void {
  for (const entry of paths) {
    const p = typeof entry === "string" ? entry : entry.path;
    const dest = join(tmpDir, p);
    if (existsSync(dest)) {
      rmSync(dest, { recursive: true, force: true });
    }
  }
}

function createThreeWayMergeRepo(
  basePath: string,
  mainPath: string,
  worktreePath: string,
  paths: (string | CopyPathEntry)[],
): { tmpDir: string; hasChanges: boolean; hasConflicts: boolean } {
  const tmpDir = mkdtempSync(join(tmpdir(), "wt-merge-config-"));

  initTmpRepo(tmpDir);

  copyPaths(basePath, tmpDir, paths, { quiet: true });
  commitAll(tmpDir, "base");

  execSync("git checkout -q -b worktree", { cwd: tmpDir, stdio: "ignore" });
  clearPaths(tmpDir, paths);
  copyPaths(worktreePath, tmpDir, paths, { quiet: true });
  commitAll(tmpDir, "worktree changes");

  execSync("git checkout -q main", { cwd: tmpDir, stdio: "ignore" });
  clearPaths(tmpDir, paths);
  copyPaths(mainPath, tmpDir, paths, { quiet: true });
  commitAll(tmpDir, "main changes");

  const mergeResult = spawnSync("git", ["merge", "--no-edit", "worktree"], {
    cwd: tmpDir,
    stdio: "ignore",
  });
  const hasConflicts = mergeResult.status !== 0;

  if (hasConflicts) {
    return { tmpDir, hasChanges: true, hasConflicts: true };
  }

  const diff = execSync("git diff main~1..main", {
    cwd: tmpDir,
    encoding: "utf-8",
  });

  return { tmpDir, hasChanges: !!diff.trim(), hasConflicts: false };
}

function createTwoWayDiffRepo(
  mainPath: string,
  worktreePath: string,
  paths: (string | CopyPathEntry)[],
): { tmpDir: string; hasChanges: boolean } {
  const tmpDir = mkdtempSync(join(tmpdir(), "wt-merge-config-"));

  initTmpRepo(tmpDir);

  copyPaths(mainPath, tmpDir, paths, { quiet: true });
  commitAll(tmpDir, "base");

  clearPaths(tmpDir, paths);
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
): { tmpDir: string; diffStat: string; hasConflicts: boolean } | null {
  const basePath = getConfigBasePath(worktreePath);

  if (basePath) {
    const { tmpDir, hasChanges, hasConflicts } = createThreeWayMergeRepo(
      basePath,
      mainPath,
      worktreePath,
      paths,
    );

    if (!hasChanges) {
      rmSync(tmpDir, { recursive: true, force: true });
      return null;
    }

    const diffStat = execSync("git diff --stat HEAD~1", {
      cwd: tmpDir,
      encoding: "utf-8",
    });

    return { tmpDir, diffStat, hasConflicts };
  }

  const { tmpDir, hasChanges } = createTwoWayDiffRepo(
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

  return { tmpDir, diffStat, hasConflicts: false };
}

export function runPatchApprovalFlow(
  tmpDir: string,
  mainPath: string,
  hasConflicts: boolean,
): number {
  if (hasConflicts) {
    console.log("\nConflicts detected — opening editor to resolve...");
    const files = execSync("git diff --name-only --diff-filter=U", {
      cwd: tmpDir,
      encoding: "utf-8",
    }).trim();
    for (const file of files.split("\n")) {
      spawnSync(process.env.EDITOR ?? "vim", [file], {
        cwd: tmpDir,
        stdio: "inherit",
      });
    }
    execSync("git add -A", { cwd: tmpDir, stdio: "ignore" });
    execSync('git commit -q -m "resolved" --no-edit', {
      cwd: tmpDir,
      stdio: "ignore",
    });
  }

  execSync("git reset HEAD~1", { cwd: tmpDir, stdio: "ignore" });
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
