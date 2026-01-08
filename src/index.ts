#!/usr/bin/env node
import { program } from "commander";
import { create } from "./commands/create.js";
import { deleteWorktree } from "./commands/delete.js";
import { open } from "./commands/open.js";
import { close } from "./commands/close.js";
import { completions } from "./commands/completions.js";

program
  .name("wt")
  .description("Quickly create and manage Git worktrees with random names")
  .version("0.1.0");

program
  .command("new")
  .description("Create a new worktree with a random name")
  .argument("[ref]", "Branch name or commit SHA to base the worktree on")
  .option("-e, --existing", "Checkout an existing branch instead of creating a new one")
  .action(create);

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
  .command("completions")
  .description("Generate shell completions")
  .option("-s, --shell <shell>", "Shell type", "fish")
  .action(completions);

program.parse();
