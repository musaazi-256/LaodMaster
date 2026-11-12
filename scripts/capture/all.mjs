// npm run capture: one command that refreshes every design capture.
// Starts what's needed, captures listed screens, discovers new ones, replays the
// documented journeys, rebuilds the handoff bundle, then records which UI source
// it captured (checked by tests/capture-fresh.test.mjs).
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { startServers } from "./servers.mjs";
import { uiFingerprint } from "./fingerprint.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const node = (script) => spawnSync(process.execPath, [script], { cwd: root, stdio: "inherit" }).status;
const stop = await startServers();
let status = 0;
try {
  status ||= node("scripts/capture/run.mjs");
  status ||= node("scripts/capture/journeys.mjs");
  status ||= node("scripts/handoff.mjs");
  if (!status) writeFileSync(root + "design/handoff/captures/source.json", JSON.stringify({ fingerprint: uiFingerprint(), capturedAt: new Date().toISOString() }, null, 1) + "\n");
} finally {
  stop();
}
console.log(status ? "\nCapture finished with errors (see above)." : "\nCaptures are up to date. In Figma: open the plugin and press Generate.");
process.exit(status);
