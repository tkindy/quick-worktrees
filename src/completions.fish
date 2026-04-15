complete --command wt --no-files

complete --command wt --condition "__fish_use_subcommand" --arguments "close" --description "Close the current iTerm window"
complete --command wt --condition "__fish_use_subcommand" --arguments "start" --description "Start work on a new task, reusing a worktree if available"
complete --command wt --condition "__fish_use_subcommand" --arguments "finish" --description "Finish work and release the worktree for reuse"
complete --command wt --condition "__fish_use_subcommand" --arguments "refresh" --description "Rerun the setup script in the current worktree"
complete --command wt --condition "__fish_use_subcommand" --arguments "merge-config" --description "Interactively merge worktree config changes back to the main repo"
complete --command wt --condition "__fish_use_subcommand" --arguments "open" --description "Open an existing worktree in iTerm"
complete --command wt --condition "__fish_use_subcommand" --arguments "list" --description "List worktrees for the current repo"
complete --command wt --condition "__fish_use_subcommand" --arguments "completions" --description "Generate Fish shell completions"

complete --command wt --condition "__fish_seen_subcommand_from open" --arguments "(wt list 2>/dev/null | string replace --regex --filter '(\\S+)\\s+(.+)' '\$1\t\$2' | string match --invert --regex '\\(available\\)')" --description "Worktree"
complete --command wt --condition "__fish_seen_subcommand_from finish" --arguments "(wt list 2>/dev/null | string replace --regex --filter '(\\S+)\\s+(.+)' '\$1\t\$2' | string match --invert --regex '\\(available\\)')" --description "Worktree"
complete --command wt --condition "__fish_seen_subcommand_from finish" --short-option f --long-option force --description "Skip prompts, discard changes, and delete the branch"

complete --command wt --condition "__fish_seen_subcommand_from start" --arguments "(git branch --format='%(refname:short)')" --description "Branch"
complete --command wt --condition "__fish_seen_subcommand_from start" --short-option e --long-option existing --description "Checkout an existing branch instead of creating a new one"
complete --command wt --condition "__fish_seen_subcommand_from start" --short-option b --long-option branch-name --exclusive --description "Use a custom branch name instead of a random one"
complete --command wt --condition "__fish_seen_subcommand_from completions" --short-option s --long-option shell --exclusive --arguments "fish" --description "Shell type"
