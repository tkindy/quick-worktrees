import { execSync } from "node:child_process";

export function openInNewWindow(directory: string): void {
  const script = `
    tell application "iTerm2"
      create window with default profile
      tell current session of current window
        write text "cd ${directory.replace(/"/g, '\\"')}"
      end tell
    end tell
  `;

  execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
    stdio: ["inherit", process.stderr, "inherit"],
  });
}
