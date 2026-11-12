// Periodic check: fails when the apps' UI code changed after the last
// `npm run capture`, so Figma never silently drifts from the code.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { uiFingerprint } from "../scripts/capture/fingerprint.mjs";

test("Figma captures match the current UI code", () => {
  const file = new URL("../design/handoff/captures/source.json", import.meta.url);
  if (!existsSync(file)) return; // Captures were never taken in this checkout.
  const { fingerprint, capturedAt } = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(uiFingerprint(), fingerprint, `UI code changed since the last capture (${capturedAt}). Run: npm run capture`);
});
