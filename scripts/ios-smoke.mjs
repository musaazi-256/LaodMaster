import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { nativeEnv, root } from "./native-env.mjs";
const env = nativeEnv();
function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  });
  if (result.status) throw new Error(result.stderr || `${command} failed`);
  return result.stdout;
}
for (const port of [4000, 8081, 8082]) {
  try {
    await fetch(
      `http://localhost:${port}/${port === 4000 ? "health" : "status"}`,
    );
  } catch {
    throw new Error(
      `Start the demo service and both Metro servers first (port ${port} unavailable).`,
    );
  }
}
const devices = JSON.parse(
  run("xcrun", ["simctl", "list", "devices", "booted", "--json"], true),
);
const device = Object.values(devices.devices)
  .flat()
  .find((d) => d.state === "Booted" && d.isAvailable);
if (!device)
  throw new Error("Boot an iPhone simulator before running this check.");
for (const name of ["LoadMasterCustomer", "LoadMasterDriver"]) {
  const app = resolve(root, "artifacts/ios", `${name}.app`);
  if (!existsSync(app)) throw new Error("Run npm run build:ios first.");
  run("xcrun", ["simctl", "install", device.udid, app]);
}
run("ruby", ["scripts/ios-smoke/create-project.rb"]);
run("xcodebuild", [
  "test",
  "-quiet",
  "-project",
  ".toolchains/ios-smoke/NativeSmoke.xcodeproj",
  "-scheme",
  "NativeSmoke",
  "-destination",
  `platform=iOS Simulator,id=${device.udid}`,
  "-derivedDataPath",
  ".toolchains/ios-smoke-build",
  "-resultBundlePath",
  `.toolchains/ios-smoke-${Date.now()}.xcresult`,
  "CODE_SIGNING_ALLOWED=NO",
]);
