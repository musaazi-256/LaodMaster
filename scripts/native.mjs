import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { nativeEnv, root } from "./native-env.mjs";
const [role, platform, ...args] = process.argv.slice(2);
if (
  !["customer", "driver"].includes(role) ||
  !["ios", "android"].includes(platform)
)
  throw new Error("Use customer|driver ios|android");
const env = nativeEnv();
const result = spawnSync(
  process.execPath,
  [
    resolve(root, "node_modules/expo/bin/cli"),
    `run:${platform}`,
    "--port",
    role === "customer" ? "8081" : "8082",
    ...args,
  ],
  { cwd: resolve(root, "apps", role), env, stdio: "inherit" },
);
process.exit(result.status ?? 1);
