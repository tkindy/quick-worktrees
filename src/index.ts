#!/usr/bin/env node
import { program } from "commander";
import { close } from "./commands/close.js";
import { completions } from "./commands/completions.js";
import { start } from "./commands/start.js";
import { finish } from "./commands/finish.js";
import { list } from "./commands/list.js";
import { mergeConfig } from "./commands/merge-config.js";
import { open } from "./commands/open.js";
import { refresh } from "./commands/refresh.js";

program
  .name("wt")
  .description("Quickly create and manage Git worktrees with random names")
  .version("0.1.0");

program
  .command("close")
  .description("Close the current iTerm window")
  .action(close);

program
  .command("start")
  .description("Start work on a new task, reusing an available worktree or creating a new one")
  .argument("[ref]", "Branch name or commit SHA to base the worktree on")
  .option("-e, --existing", "Checkout an existing branch instead of creating a new one")
  .option("-b, --branch-name <name>", "Use a custom branch name instead of a random one")
  .action(start);

program
  .command("finish")
  .description("Finish work and release a worktree for reuse")
  .argument("[name]", "Worktree directory name or branch name (defaults to current directory)")
  .option("-f, --force", "Skip prompts, discard changes, and delete the branch")
  .option("-k, --keep-branch", "Keep the branch instead of deleting it")
  .action(finish);

program
  .command("open")
  .description("Open an existing worktree in iTerm")
  .argument("<name>", "Worktree directory name or branch name")
  .action(open);

program
  .command("list")
  .description("List worktrees for the current repo")
  .action(list);

program
  .command("refresh")
  .description("Rerun the setup script in the current worktree")
  .action(refresh);

program
  .command("merge-config")
  .description("Interactively merge worktree config changes back to the main repo")
  .action(mergeConfig);

program
  .command("completions")
  .description("Generate shell completions")
  .option("-s, --shell <shell>", "Shell type", "fish")
  .action(completions);

program.parse();
