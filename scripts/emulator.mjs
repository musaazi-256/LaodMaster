import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { nativeEnv } from "./native-env.mjs";
const env = nativeEnv();
if (!env.ANDROID_HOME)
  throw new Error("Install the Android SDK or set ANDROID_HOME.");
const child = spawn(
  resolve(env.ANDROID_HOME, "emulator/emulator"),
  [
    "-avd",
    "LoadMaster_V2_API37",
    "-gpu",
    "swiftshader",
    ...process.argv.slice(2),
  ],
  { env, stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 1));
