import { execSync } from "node:child_process";

export function closeCurrentWindow(): void {
  const sessionId = process.env.ITERM_SESSION_ID;
  if (!sessionId) return;

  const uuid = sessionId.split(":")[1];
  if (!uuid) return;

  const script = `
    tell application "iTerm2"
      repeat with aWindow in windows
        tell aWindow
          repeat with aTab in tabs
            tell aTab
              repeat with aSession in sessions
                if unique ID of aSession is "${uuid}" then
                  close aWindow
                  return
                end if
              end repeat
            end tell
          end repeat
        end tell
      end repeat
    end tell
  `;

  try {
    execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
      stdio: "ignore",
    });
  } catch {
    // Ignore errors - window may already be closed
  }
}

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
