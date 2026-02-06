#!/usr/bin/env node
import { program } from "commander";
import { newWorktree } from "./commands/new.js";
import { deleteWorktree } from "./commands/delete.js";
import { open } from "./commands/open.js";
import { close } from "./commands/close.js";
import { completions } from "./commands/completions.js";
import { start } from "./commands/start.js";
import { finish } from "./commands/finish.js";

program
  .name("wt")
  .description("Quickly create and manage Git worktrees with random names")
  .version("0.1.0");

program
  .command("new")
  .description("Create a new worktree with a random name")
  .argument("[ref]", "Branch name or commit SHA to base the worktree on")
  .option("-e, --existing", "Checkout an existing branch instead of creating a new one")
  .option("-b, --branch-name <name>", "Use a custom branch name instead of a random one")
  .action(newWorktree);

program
  .command("delete")
  .description("Remove the worktree in the current directory")
  .action(deleteWorktree);

program
  .command("open")
  .description("Open an existing worktree in a new iTerm window")
  .argument("<branch>", "Branch name of the worktree to open")
  .action(open);

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
  .description("Finish work and release the current worktree for reuse")
  .action(finish);

program
  .command("completions")
  .description("Generate shell completions")
  .option("-s, --shell <shell>", "Shell type", "fish")
  .action(completions);

program.parse();
