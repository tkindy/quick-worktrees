import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

export function copyPaths(
  sourcePath: string,
  destPath: string,
  paths: string[]
): void {
  for (const relativePath of paths) {
    const src = join(sourcePath, relativePath);
    const dest = join(destPath, relativePath);

    if (!existsSync(src)) {
      continue;
    }

    console.log(`Copying: ${relativePath}`);
    cpSync(src, dest, { recursive: true });
  }
}
