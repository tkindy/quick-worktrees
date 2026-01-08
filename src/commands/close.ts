import { closeCurrentWindow } from "../lib/iterm.js";

export function close(): void {
  if (!process.env.ITERM_SESSION_ID) {
    console.error("Error: Not running in an iTerm session");
    process.exit(1);
  }

  closeCurrentWindow();
}
