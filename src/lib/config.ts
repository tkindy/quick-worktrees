import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ConductorConfig } from "../types.js";
import { getRepoRoot } from "./git.js";

export function loadConfig(): ConductorConfig | null {
  try {
    const root = getRepoRoot();
    const configPath = join(root, "conductor.json");
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content) as ConductorConfig;
  } catch {
    return null;
  }
}
