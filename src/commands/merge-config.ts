import { execSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  cpSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { loadConfig } from "../lib/config.js";
import { getMainWorktreePath, getRepoRoot, isWorktree } from "../lib/git.js";

function removeNestedGitignores(dir: string): void {
  execSync(
    'find . -path ./.git -prune -o -name .gitignore -type f -exec rm {} +',
    { cwd: dir, stdio: "ignore" }
  );
}

export function mergeConfig(): void {
  if (!isWorktree()) {
    console.error("Error: Current directory is not a git worktree");
    process.exit(1);
  }

  const config = loadConfig();
  if (!config?.copyPaths?.length) {
    console.error("Error: No copyPaths configured in wt.json");
    process.exit(1);
  }

  const mainPath = getMainWorktreePath();
  const worktreePath = getRepoRoot();
  const tmpDir = mkdtempSync(join(tmpdir(), "wt-merge-config-"));

  try {
    execSync("git init -q", { cwd: tmpDir, stdio: "ignore" });
    execSync('git config user.email "wt"', { cwd: tmpDir, stdio: "ignore" });
    execSync('git config user.name "wt"', { cwd: tmpDir, stdio: "ignore" });

    // Often the copied files are copied specifically because they're gitignored,
    // so ignore the ignores
    execSync("git config core.excludesFile /dev/null", {
      cwd: tmpDir,
      stdio: "ignore",
    });

    for (const p of config.copyPaths) {
      const src = join(mainPath, p);
      if (existsSync(src)) {
        const dest = join(tmpDir, p);
        cpSync(src, dest, { recursive: true });
      }
    }

    removeNestedGitignores(tmpDir);
    execSync("git add -A", { cwd: tmpDir, stdio: "ignore" });
    execSync('git commit -q -m "base" --allow-empty', {
      cwd: tmpDir,
      stdio: "ignore",
    });

    for (const p of config.copyPaths) {
      const src = join(worktreePath, p);
      const dest = join(tmpDir, p);

      if (existsSync(src)) {
        cpSync(src, dest, { recursive: true });
      } else if (existsSync(dest)) {
        rmSync(dest, { recursive: true, force: true });
      }
    }

    removeNestedGitignores(tmpDir);

    const status = execSync("git status --porcelain", {
      cwd: tmpDir,
      encoding: "utf-8",
    });
    if (!status.trim()) {
      console.log("No changes to merge");
      return;
    }

    execSync("git add -N .", { cwd: tmpDir, stdio: "ignore" });

    console.log(
      execSync("git diff --stat", { cwd: tmpDir, encoding: "utf-8" })
    );

    spawnSync("git", ["add", "-p"], { cwd: tmpDir, stdio: "inherit" });

    const stagedStatus = execSync("git diff --cached --name-status", {
      cwd: tmpDir,
      encoding: "utf-8",
    }).trim();

    if (!stagedStatus) {
      console.log("No changes selected");
      return;
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

    console.log(`\nMerged ${applied} file(s) to main repo`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
