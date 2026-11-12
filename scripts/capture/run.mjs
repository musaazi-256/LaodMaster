// Captures the running apps screen by screen for the Figma handoff plugin.
//   node scripts/capture/run.mjs [screen-id,...]
// Needs the demo service (:4000), customer web (:8091), driver web (:8092) and
// admin (:5173) running. Writes design/handoff/captures/<id>.json, then
// `npm run handoff` bundles them into loadmaster-handoff-captured.json.
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SCREENS } from "./screens.mjs";
import { glyphSvg, isIconFont } from "./glyphs.mjs";
import { discover } from "./discover.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const out = root + "design/handoff/captures/";
mkdirSync(out, { recursive: true });
const extract = readFileSync(new URL("./extract.js", import.meta.url), "utf8").replace(/^(\s*\/\/[^\n]*\n)+/, "").trim().replace(/;$/, "");
const only = process.argv[2] ? new Set(process.argv[2].split(",")) : null;
const VIEW = { mobile: { width: 390, height: 844 }, admin: { width: 1440, height: 900 } };

const browser = await chromium.launch({ channel: "chrome" });
const sessions = new Map();

async function session(app, signedOut) {
  const key = app.key + (signedOut ? ":out" : "");
  if (sessions.has(key)) return sessions.get(key);
  const ctx = await browser.newContext({ viewport: VIEW[app.kind], deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(app.url);
  await page.waitForTimeout(2500);
  if (!signedOut) await app.login(page);
  sessions.set(key, page);
  return page;
}
export const api = async (path, token, body) => {
  const r = await fetch("http://localhost:4000" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token, "Idempotency-Key": "cap-" + Date.now() + Math.random() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(path + ": " + (j.error?.message || r.status));
  return j;
};

const steps = async (page, list) => {
  for (const s of list || []) {
    if (typeof s === "function") await s(page);
    else if (s.click) await page.getByText(s.click, { exact: s.exact ?? false }).first().click();
    else if (s.goto) await page.goto(s.goto);
    else if (s.fill) await page.getByPlaceholder(s.fill).first().fill(s.value);
    if (s.wait !== 0) await page.waitForTimeout(s.wait ?? 900);
  }
};

// Icon-font glyphs become vector SVGs (Figma has no icon fonts).
function iconsToSvg(n) {
  for (const [i, k] of (n.kids || []).entries()) {
    if (k.k === "text" && isIconFont(k.st.f)) {
      const g = glyphSvg(k.st.f, k.t, k.st.s, k.st.c, k.w, k.h);
      if (g) n.kids[i] = { k: "svg", n: "Icon", x: k.x, y: k.y, w: g.w, h: k.h, svg: g.svg };
    } else iconsToSvg(k);
  }
}

const failed = [];
for (const sc of SCREENS) {
  if (only && !only.has(sc.id)) continue;
  try {
    const page = await session(sc.app, sc.signedOut);
    if (sc.setup) await sc.setup(api);
    // Start every screen from the app's entry point so captures are independent.
    await page.goto(sc.app.url + (sc.path || ""));
    await page.waitForTimeout(sc.app.kind === "admin" ? 2500 : 3000);
    await steps(page, sc.steps);
    await page.waitForTimeout(sc.settle ?? 700);
    const v = VIEW[sc.app.kind];
    const tree = await page.evaluate(`(${extract})(${JSON.stringify(v)})`);
    if (process.env.CAPTURE_SHOTS) await page.screenshot({ path: process.env.CAPTURE_SHOTS + "/" + sc.id + ".png" });
    iconsToSvg(tree);
    writeFileSync(out + sc.id + ".json", JSON.stringify({ id: sc.id, app: sc.app.key, ...tree }));
    if (sc.teardown) await sc.teardown(api);
    console.log("✓", sc.id);
  } catch (e) {
    failed.push(sc.id);
    console.log("✗", sc.id, String(e.message || e).split("\n")[0]);
    // Start that app fresh for the next screen.
    const key = sc.app.key + (sc.signedOut ? ":out" : "");
    const p = sessions.get(key);
    sessions.delete(key);
    await p?.context().close().catch(() => undefined);
  }
}
// Anything in the code that the spec doesn't list yet.
if (!only) await discover(browser, { api, extract, iconsToSvg, out });
await browser.close();
if (failed.length) console.log("Not captured:", failed.join(", "));
