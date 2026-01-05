export function completions(): void {
  const script = `complete --command wt --no-files

complete --command wt --condition "__fish_use_subcommand" --arguments "new" --description "Create a new worktree with a random name"
complete --command wt --condition "__fish_use_subcommand" --arguments "delete" --description "Remove the worktree in the current directory"
complete --command wt --condition "__fish_use_subcommand" --arguments "completions" --description "Generate Fish shell completions"

complete --command wt --condition "__fish_seen_subcommand_from new" --arguments "(git branch --format='%(refname:short)')" --description "Branch"
complete --command wt --condition "__fish_seen_subcommand_from new" --short-option e --long-option existing --description "Checkout an existing branch instead of creating a new one"
complete --command wt --condition "__fish_seen_subcommand_from completions" --short-option s --long-option shell --exclusive --arguments "fish" --description "Shell type"`;

  console.log(script);
}
