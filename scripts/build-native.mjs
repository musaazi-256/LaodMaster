import { spawnSync } from "node:child_process";
import { mkdirSync, copyFileSync, cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { nativeEnv, root } from "./native-env.mjs";
const [platform = "android", target = "all"] = process.argv.slice(2);
const env = nativeEnv();
const roles = target === "all" ? ["customer", "driver"] : [target];
let failed = false;
for (const role of roles) {
  if (!["customer", "driver"].includes(role))
    throw new Error("Unknown application");
  const cwd = resolve(root, "apps", role);
  const pre = spawnSync(
    process.execPath,
    [
      resolve(root, "node_modules/expo/bin/cli"),
      "prebuild",
      "--platform",
      platform,
      "--no-install",
    ],
    { cwd, env, stdio: "inherit" },
  );
  if (pre.status) {
    failed = true;
    continue;
  }
  if (platform === "android") {
    const result = spawnSync(
      "./gradlew",
      [
        "app:assembleDebug",
        "--no-daemon",
        "--max-workers=3",
        "-PreactNativeArchitectures=arm64-v8a",
        "-PreactNativeDevServerPort=" + (role === "customer" ? "8081" : "8082"),
      ],
      { cwd: resolve(cwd, "android"), env, stdio: "inherit" },
    );
    if (result.status) {
      failed = true;
      continue;
    }
    const source = resolve(
      cwd,
      "android/app/build/outputs/apk/debug/app-debug.apk",
    );
    if (existsSync(source)) {
      mkdirSync(resolve(root, "artifacts/android"), { recursive: true });
      copyFileSync(
        source,
        resolve(root, `artifacts/android/loadmaster-${role}-debug.apk`),
      );
    }
  } else {
    const check = spawnSync("xcodebuild", ["-version"], {
      env,
      stdio: "inherit",
    });
    if (check.status) {
      console.error(
        "Full Xcode is required to compile an iOS simulator binary. Install Xcode and select its developer directory.",
      );
      failed = true;
      continue;
    }
    const pods = spawnSync("pod", ["install"], {
      cwd: resolve(cwd, "ios"),
      env,
      stdio: "inherit",
    });
    if (pods.status) {
      failed = true;
      continue;
    }
    const scheme =
      role === "customer" ? "LoadMasterCustomer" : "LoadMasterDriver";
    const result = spawnSync(
      "xcodebuild",
      [
        "-workspace",
        `${scheme}.xcworkspace`,
        "-scheme",
        scheme,
        "-configuration",
        "Debug",
        "-sdk",
        "iphonesimulator",
        "-destination",
        "generic/platform=iOS Simulator",
        "-derivedDataPath",
        resolve(root, ".toolchains/ios-build", role),
        "CODE_SIGNING_ALLOWED=YES",
        "CODE_SIGN_IDENTITY=-",
        "build",
      ],
      { cwd: resolve(cwd, "ios"), env, stdio: "inherit" },
    );
    if (result.status) failed = true;
    else {
      const source = resolve(
        root,
        ".toolchains/ios-build",
        role,
        "Build/Products/Debug-iphonesimulator",
        `${scheme}.app`,
      );
      mkdirSync(resolve(root, "artifacts/ios"), { recursive: true });
      cpSync(source, resolve(root, `artifacts/ios/${scheme}.app`), {
        recursive: true,
      });
    }
  }
}
process.exit(failed ? 1 : 0);
