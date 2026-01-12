import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

interface WindowCache {
  [worktreePath: string]: number;
}

function getCachePath(): string {
  return join(homedir(), ".wt", "window-cache.json");
}

function getLockPath(): string {
  return join(homedir(), ".wt", "window-cache.lock");
}

function ensureCacheDir(): void {
  const dir = join(homedir(), ".wt");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLock(): void {
  ensureCacheDir();
  const lockPath = getLockPath();
  const maxAttempts = 100;
  const retryDelayMs = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      writeFileSync(lockPath, String(process.pid), { flag: "wx" });
      return;
    } catch (err: unknown) {
      if (err instanceof Error && "code" in err && err.code === "EEXIST") {
        try {
          const pid = parseInt(readFileSync(lockPath, "utf-8"), 10);
          if (!isProcessRunning(pid)) {
            unlinkSync(lockPath);
            continue;
          }
        } catch {
          try {
            unlinkSync(lockPath);
          } catch {}
          continue;
        }

        sleep(retryDelayMs);
        continue;
      }
      throw err;
    }
  }

  throw new Error("Could not acquire cache lock");
}

function releaseLock(): void {
  try {
    unlinkSync(getLockPath());
  } catch {}
}

function withLock<T>(fn: () => T): T {
  acquireLock();
  try {
    return fn();
  } finally {
    releaseLock();
  }
}

function readCache(): WindowCache {
  const path = getCachePath();
  if (!existsSync(path)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}

function writeCache(cache: WindowCache): void {
  const cachePath = getCachePath();
  const tempPath = join(dirname(cachePath), `.window-cache.${process.pid}.tmp`);
  writeFileSync(tempPath, JSON.stringify(cache, null, 2));
  renameSync(tempPath, cachePath);
}

export function getCachedWindowId(worktreePath: string): number | null {
  const cache = readCache();
  return cache[worktreePath] ?? null;
}

export function setCachedWindowId(worktreePath: string, windowId: number): void {
  withLock(() => {
    const cache = readCache();
    cache[worktreePath] = windowId;
    writeCache(cache);
  });
}

export function removeCachedWindow(worktreePath: string): void {
  withLock(() => {
    const cache = readCache();
    delete cache[worktreePath];
    writeCache(cache);
  });
}
