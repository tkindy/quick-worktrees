#!/usr/bin/env node
import { program } from "commander";
import { create } from "./commands/create.js";

program
  .name("wt")
  .description("Quickly create Git worktrees with random names")
  .version("0.1.0")
  .argument("[ref]", "Branch name or commit SHA to base the worktree on")
  .action(create);

program.parse();
