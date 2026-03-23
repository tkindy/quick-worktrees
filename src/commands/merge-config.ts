import { loadConfig } from "../lib/config.js";
import { getMainWorktreePath, getRepoRoot, isWorktree } from "../lib/git.js";
import {
  getConfigDiffStat,
  runPatchApprovalFlow,
  cleanupTmpDir,
} from "../lib/config-diff.js";

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

  const result = getConfigDiffStat(mainPath, worktreePath, config.copyPaths);
  if (!result) {
    console.log("No changes to merge");
    return;
  }

  const { tmpDir, diffStat } = result;

  try {
    console.log(diffStat);
    runPatchApprovalFlow(tmpDir, mainPath);
  } finally {
    cleanupTmpDir(tmpDir);
  }
}
