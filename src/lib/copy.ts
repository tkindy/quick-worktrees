import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type { CopyPathEntry } from "../types.js";

function collectExcludes(children: CopyPathEntry[] | undefined): string[] {
  const excludes: string[] = [];
  for (const child of children ?? []) {
    const mode = child.mode ?? "copy";
    if (mode === "exclude") {
      excludes.push(child.path);
    } else {
      for (const nested of collectExcludes(child.children)) {
        excludes.push(join(child.path, nested));
      }
    }
  }
  return excludes;
}

function clearDescendants(
  destBase: string,
  children: CopyPathEntry[] | undefined,
): void {
  for (const child of children ?? []) {
    const mode = child.mode ?? "copy";
    if (mode === "clear-first") {
      rmSync(join(destBase, child.path), { recursive: true, force: true });
    } else if (mode !== "exclude") {
      clearDescendants(join(destBase, child.path), child.children);
    }
  }
}

function processEntry(
  sourceBase: string,
  destBase: string,
  entry: CopyPathEntry,
  quiet: boolean,
): void {
  const mode = entry.mode ?? "copy";
  if (mode === "exclude") return;

  const src = join(sourceBase, entry.path);
  const dest = join(destBase, entry.path);

  if (!existsSync(src)) return;

  if (!quiet) {
    console.log(`Copying: ${entry.path}`);
  }

  if (mode === "clear-first") {
    rmSync(dest, { recursive: true, force: true });
  } else {
    clearDescendants(dest, entry.children);
  }

  const excludes = collectExcludes(entry.children);

  mkdirSync(dirname(dest), { recursive: true });

  if (excludes.length === 0) {
    cpSync(src, dest, { recursive: true });
  } else {
    cpSync(src, dest, {
      recursive: true,
      filter: (source) => {
        if (source === src) return true;
        const rel = relative(src, source);
        return !excludes.some(
          (ex) => rel === ex || rel.startsWith(ex + "/"),
        );
      },
    });
  }
}

export function copyPaths(
  sourcePath: string,
  destPath: string,
  paths: (string | CopyPathEntry)[],
  options?: { quiet?: boolean },
): void {
  const quiet = options?.quiet ?? false;
  for (const entry of paths) {
    if (typeof entry === "string") {
      processEntry(sourcePath, destPath, { path: entry }, quiet);
    } else {
      processEntry(sourcePath, destPath, entry, quiet);
    }
  }
}
