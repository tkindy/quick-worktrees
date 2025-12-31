import { execSync } from "node:child_process";

export function openInNewWindow(directory: string, setupScript?: string): void {
  const escapedDir = directory.replace(/"/g, '\\"');
  const commands = [`cd ${escapedDir}`];
  if (setupScript) {
    const escapedScript = setupScript.replace(/"/g, '\\"');
    commands.push(`/bin/bash -c \\"${escapedScript}\\"`);
  }

  const script = `
    tell application "iTerm2"
      create window with default profile
      tell current session of current window
        write text "${commands.join(" && ")}"
      end tell
    end tell
  `;

  execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
    stdio: ["inherit", process.stderr, "inherit"],
  });
}
