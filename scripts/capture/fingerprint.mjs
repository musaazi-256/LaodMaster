// A hash of every file that shapes what the apps look like. When it changes,
// the Figma captures are out of date.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const DIRS = ["packages/mobile/src", "apps/admin/src", "apps/customer/assets", "apps/driver/assets"];
const files = (dir) => {
  let out = [];
  let names = [];
  try {
    names = readdirSync(root + dir).sort();
  } catch {
    return out;
  }
  for (const n of names) {
    const p = dir + "/" + n;
    if (statSync(root + p).isDirectory()) out = out.concat(files(p));
    else if (!/\.test\.|\.d\.ts$/.test(n)) out.push(p);
  }
  return out;
};
export function uiFingerprint() {
  const h = createHash("sha256");
  for (const f of DIRS.flatMap(files)) h.update(f + "\0").update(readFileSync(root + f));
  return h.digest("hex").slice(0, 16);
}
