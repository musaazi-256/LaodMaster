// Starts what the capture needs and stops what it started. The web apps always
// run fresh on capture-only ports (8191/8192) so captures match the current code
// and your own dev servers (8081/8082, 8091/8092) are left alone. The admin
// portal is rebuilt so new pages are served; the demo service is reused if up.
import { spawn, execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const SERVICES = [
  { name: "demo service", url: "http://localhost:4000/health", cmd: "node", args: ["services/demo/server.mjs"], cwd: root },
  { name: "customer web", url: "http://localhost:8191", cmd: "npx", args: ["expo", "start", "--web", "--port", "8191"], cwd: root + "apps/customer" },
  { name: "driver web", url: "http://localhost:8192", cmd: "npx", args: ["expo", "start", "--web", "--port", "8192"], cwd: root + "apps/driver" },
];
const up = async (url) => {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(3000) })).ok;
  } catch {
    return false;
  }
};

// A demo service started before its code last changed would be captured with
// yesterday's behaviour: restart it (its data lives in services/demo/data) and
// leave it running, as a demo you started yourself would be.
function restartStaleDemo() {
  let pid;
  try {
    pid = execSync("lsof -ti tcp:4000 -sTCP:LISTEN", { encoding: "utf8" }).trim().split("\n")[0];
  } catch {
    return false;
  }
  if (!pid) return false;
  const started = new Date(execSync(`ps -o lstart= -p ${pid}`, { encoding: "utf8" }).trim()).getTime();
  const dir = root + "services/demo/";
  const changed = Math.max(...readdirSync(dir).filter((f) => f.endsWith(".mjs")).map((f) => statSync(dir + f).mtimeMs));
  if (!(changed > started)) return false;
  console.log("• Demo service code changed since it started: restarting it");
  process.kill(Number(pid));
  execSync("sleep 1.5");
  spawn("node", ["services/demo/server.mjs"], { cwd: root, stdio: "ignore", detached: true }).unref();
  return true;
}

export async function startServers() {
  console.log("• Rebuilding the admin portal");
  execSync("npm run admin:build", { cwd: root, stdio: "ignore" });
  if (restartStaleDemo()) {
    const deadline = Date.now() + 30000;
    while (!(await up(SERVICES[0].url)) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 1000));
  }
  const started = [];
  for (const s of SERVICES) {
    const fresh = s.url.includes(":81");
    if (fresh && (await up(s.url))) {
      // A capture server left over from an interrupted run: replace it.
      try {
        // Only the listener: without -sTCP:LISTEN, lsof also lists this process's own
        // keep-alive connection from the up() check, and the capture kills itself.
        execSync(`lsof -ti tcp:${new URL(s.url).port} -sTCP:LISTEN | xargs kill`, { stdio: "ignore" });
      } catch {
        // Nothing to stop.
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (!fresh && (await up(s.url))) continue;
    console.log("• Starting " + s.name);
    const child = spawn(s.cmd, s.args, { cwd: s.cwd, env: { ...process.env, CI: "1", BROWSER: "none" }, stdio: "ignore", detached: true });
    started.push(child);
    const deadline = Date.now() + 180000;
    while (!(await up(s.url))) {
      if (Date.now() > deadline) throw new Error(`${s.name} did not start on ${s.url}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  // Build the web bundles now so the first capture doesn't time out.
  for (const s of SERVICES.slice(1)) {
    console.log("• Bundling " + s.name);
    const html = await (await fetch(s.url)).text();
    const src = (html.match(/src="([^"]*bundle[^"]*)"/) || [])[1];
    if (src) await fetch(new URL(src.replace(/&amp;/g, "&"), s.url), { signal: AbortSignal.timeout(300000) }).then((r) => r.text()).catch(() => undefined);
  }
  return () => {
    for (const c of started) {
      try {
        process.kill(-c.pid);
      } catch {
        // Already stopped.
      }
    }
  };
}
