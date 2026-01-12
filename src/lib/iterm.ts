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

export function focusWindowById(windowId: number): boolean {
  const script = `
    tell application "iTerm2"
      repeat with w in windows
        if id of w is ${windowId} then
          activate
          set index of w to 1
          return "found"
        end if
      end repeat
      return "not_found"
    end tell
  `;

  try {
    const result = execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return result === "found";
  } catch {
    return false;
  }
}

export function openInNewWindow(directory: string, setupScript?: string): number | null {
  const escapedDir = directory.replace(/"/g, '\\"');
  const commands = [`cd ${escapedDir}`];
  if (setupScript) {
    const escapedScript = setupScript.replace(/"/g, '\\"');
    commands.push(`/bin/bash -c \\"${escapedScript}\\"`);
  }

  const script = `
    tell application "iTerm2"
      set newWindow to (create window with default profile)
      tell current session of newWindow
        write text "${commands.join(" && ")}"
      end tell
      return id of newWindow
    end tell
  `;

  try {
    const result = execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    const windowId = parseInt(result, 10);
    return isNaN(windowId) ? null : windowId;
  } catch {
    return null;
  }
}
