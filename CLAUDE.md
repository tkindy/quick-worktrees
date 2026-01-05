# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build    # Compile TypeScript to dist/
npm run dev      # Run directly with tsx (no build step)
```

## Architecture

CLI tool (`wt`) for quickly creating git worktrees with random nature-themed names.

**Entry point:** `src/index.ts` - Uses Commander.js, single command that accepts optional `[ref]` argument

**Flow:**
1. `commands/create.ts` - Main logic: gets repo info, generates name, creates worktree, opens iTerm
2. `lib/git.ts` - Git operations via `execSync` (repo root, create worktree with `--detach`)
3. `lib/names.ts` - Random word selection from 100-word nature vocabulary
4. `lib/config.ts` - Loads optional `wt.json` from repo root for setup scripts and copy paths
5. `lib/copy.ts` - Copies configured paths from source repo to new worktree
6. `lib/iterm.ts` - Opens new iTerm2 window via AppleScript, runs setup script if configured

**Worktree naming:** `{repo-name}-{random-word}` placed in parent directory of current repo

**Optional config:** Repos can have `wt.json` with `scripts.setup` to run in new worktree window and `copyPaths` array for files/directories to copy (e.g., `.idea`, `.claude`)
