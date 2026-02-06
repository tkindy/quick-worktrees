import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { WtConfig } from "../types.js";
import { getMainWorktreePath } from "./git.js";

export function loadConfig(): WtConfig | null {
  try {
    const root = getMainWorktreePath();
    const configPath = join(root, "wt.json");
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content) as WtConfig;
  } catch {
    return null;
  }
}
