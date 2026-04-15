import { existsSync } from "node:fs";
import { join } from "node:path";
import { copyPaths } from "./copy.js";
import type { CopyPathEntry } from "../types.js";

const CONFIG_BASE_DIR = ".wt/config-base";

export function saveConfigBase(
  sourcePath: string,
  worktreePath: string,
  paths: (string | CopyPathEntry)[],
): void {
  const baseDir = join(worktreePath, CONFIG_BASE_DIR);
  copyPaths(sourcePath, baseDir, paths, { quiet: true });
}

export function getConfigBasePath(worktreePath: string): string | null {
  const baseDir = join(worktreePath, CONFIG_BASE_DIR);
  return existsSync(baseDir) ? baseDir : null;
}
