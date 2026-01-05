#!/usr/bin/env node
import { program } from "commander";
import { create } from "./commands/create.js";
import { deleteWorktree } from "./commands/delete.js";

program
  .name("wt")
  .description("Quickly create and manage Git worktrees with random names")
  .version("0.1.0");

program
  .command("new")
  .description("Create a new worktree with a random name")
  .argument("[ref]", "Branch name or commit SHA to base the worktree on")
  .action(create);

program
  .command("delete")
  .description("Remove the worktree in the current directory")
  .action(deleteWorktree);

program.parse();
