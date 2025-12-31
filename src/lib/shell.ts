import { execSync } from "node:child_process";

export function runSetupScript(script: string, cwd: string): void {
  execSync(script, { cwd, stdio: "inherit", shell: "/bin/sh" });
}
