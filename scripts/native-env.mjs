import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export function nativeEnv() {
  const env = { ...process.env };
  const tools = resolve(root, ".toolchains");
  if (existsSync(resolve(tools, "java/Contents/Home/bin/java")))
    env.JAVA_HOME = resolve(tools, "java/Contents/Home");
  if (existsSync(resolve(tools, "android-sdk")))
    env.ANDROID_HOME = resolve(tools, "android-sdk");
  if (existsSync(resolve(tools, "gems/bin/pod"))) {
    env.GEM_HOME = resolve(tools, "gems");
    env.GEM_PATH = env.GEM_HOME;
    env.BUNDLE_GEMFILE = resolve(root, "scripts/native.Gemfile");
    env.RUBYOPT = "-rlogger " + (env.RUBYOPT || "");
  }
  env.GRADLE_USER_HOME = resolve(tools, "gradle");
  env.ANDROID_USER_HOME = resolve(tools, "android-user");
  env.ANDROID_AVD_HOME = resolve(tools, "avd");
  env.CP_HOME_DIR = resolve(tools, "cocoapods");
  env.CP_CACHE_DIR = resolve(tools, "cocoapods-cache");
  env.PATH = [
    env.JAVA_HOME && resolve(env.JAVA_HOME, "bin"),
    resolve(tools, "gems/bin"),
    env.ANDROID_HOME && resolve(env.ANDROID_HOME, "platform-tools"),
    env.ANDROID_HOME && resolve(env.ANDROID_HOME, "emulator"),
    env.PATH,
  ]
    .filter(Boolean)
    .join(":");
  return env;
}
