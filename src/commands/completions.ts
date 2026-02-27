import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

export function completions(): void {
  const dir = dirname(fileURLToPath(import.meta.url));
  const fishScript = readFileSync(
    resolve(dir, "..", "completions.fish"),
    "utf-8",
  );
  process.stdout.write(fishScript);
}
