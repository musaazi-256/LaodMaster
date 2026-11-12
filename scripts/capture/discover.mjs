// Finds screens that exist in the code but not in the handoff spec and captures
// them anyway, so a new page shows up in Figma without anyone listing it first.
//   Mobile: every RootStack route and tab, opened by name (window.__lmNav, dev web only).
//   Admin:  every sidebar page, opened by URL.
// Writes captures/auto-*.json plus captures/auto.json (what was found).
import { readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spec } from "../../design/handoff/spec.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (p) => readFileSync(root + p, "utf8");

function codeRoutes() {
  const nav = read("packages/mobile/src/navigation.ts");
  const block = nav.slice(nav.indexOf("export type RootStack"), nav.indexOf("\n};", nav.indexOf("export type RootStack")));
  const routes = [...block.matchAll(/^ {2}([A-Z]\w*)\??:/gm)].map((m) => m[1]).filter((r) => r !== "Main");
  const app = read("apps/admin/src/App.tsx");
  const navBlock = app.slice(app.indexOf("const navigation"), app.indexOf("\n  ];", app.indexOf("const navigation")));
  const admin = [...navBlock.matchAll(/path: "([^"]+)",\s*name: "([^"]+)"/g)].map((m) => ({ path: m[1], name: m[2] }));
  return { routes, admin };
}

function covered() {
  const out = { customer: new Set(), driver: new Set(), admin: new Set() };
  for (const a of spec.apps)
    for (const s of a.sections)
      for (const x of s.screens) {
        const first = String(x.route || "").split(/[\s(]/)[0];
        if (a.id === "admin") out.admin.add(first.replace(/^\//, ""));
        else {
          out[a.id].add(first.startsWith("Main/") ? "tab:" + first.slice(5) : first);
          if (x.tab) out[a.id].add("tab:" + x.tab);
        }
      }
  return out;
}

export async function discover(browser, { api, extract, iconsToSvg, out }) {
  for (const f of readdirSync(out)) if (f.startsWith("auto-")) rmSync(out + f);
  const { routes, admin } = codeRoutes();
  // Tab names are the string literals on <Tab.Screen name=…> in Tabs.tsx.
  const tabsSrc = read("packages/mobile/src/Tabs.tsx");
  const tabs = [...new Set([...tabsSrc.matchAll(/Tab\.Screen\s+name=\{?([^}\s>]+(?:\s*\?\s*"[^"]+"\s*:\s*"[^"]+")?)/g)].flatMap((m) => [...m[1].matchAll(/"([A-Za-z]+)"/g)].map((x) => x[1])))];
  const have = covered();
  const found = [];
  const save = async (page, id, view, meta) => {
    const tree = await page.evaluate(`(${extract})(${JSON.stringify(view)})`);
    iconsToSvg(tree);
    writeFileSync(out + id + ".json", JSON.stringify({ id, ...tree }));
    found.push({ id, ...meta });
    console.log("  ＋ new", meta.app, meta.route, "→", id);
  };

  // Mobile apps: open each uncovered route by name.
  for (const [app, url, token] of [["customer", "http://localhost:8191", "demo-customer-1"], ["driver", "http://localhost:8192", "demo-driver-1"]]) {
    const todo = [...routes.filter((r) => !have[app].has(r)), ...tabs.filter((t) => !have[app].has("tab:" + t)).map((t) => "tab:" + t)];
    if (!todo.length) continue;
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(url);
    await page.waitForTimeout(2500);
    await page.getByText("Explore with a demo account").first().click();
    await page.waitForTimeout(3500);
    if (!(await page.evaluate(() => Boolean(window.__lmNav)))) {
      console.log(`  ! ${app}: dev navigation hook missing; new mobile routes can't be opened`);
      await ctx.close();
      continue;
    }
    const snap = await api("/snapshot", token).catch(() => ({}));
    const id = snap.orders?.[0]?.id;
    const params = { Order: { id }, OrderChat: { id }, Payment: { id }, Offer: { id: snap.offers?.[0]?.id }, OrderStart: { mode: "truck" }, Handling: { loading: 0, offloading: 0 } };
    for (const r of todo) {
      const [name, p] = r.startsWith("tab:") ? ["Main", { screen: r.slice(4) }] : [r, params[r]];
      if (p && Object.values(p).some((v) => v === undefined)) continue;
      try {
        await page.goto(url);
        await page.waitForTimeout(3000);
        await page.evaluate(([n, q]) => window.__lmNav.navigate(n, q), [name, p]);
        await page.waitForTimeout(2500);
        const now = await page.evaluate(() => {
          const s = window.__lmNav.getCurrentRoute();
          return s?.name;
        });
        const want = r.startsWith("tab:") ? r.slice(4) : r;
        if (now !== want) continue; // Route not part of this app.
        await save(page, `auto-${app[0]}-${want.toLowerCase()}`, { width: 390, height: 844 }, { app, route: r.startsWith("tab:") ? "Main/" + want : want, name: want.replace(/([a-z])([A-Z])/g, "$1 $2") });
      } catch {
        // Couldn't open it with demo data: leave it to the coverage report.
      }
    }
    await ctx.close();
  }

  // Admin portal: every sidebar page not in the spec.
  const adminTodo = admin.filter((a) => !have.admin.has(a.path));
  if (adminTodo.length) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const { token } = await api("/auth/login", "", { identifier: "irene@loadmaster.test", password: "DemoCargo2026!", role: "staff" });
    await page.goto("http://localhost:4000/operations/");
    await page.evaluate((t) => localStorage.setItem("loadmaster-admin-token", t), token);
    for (const a of adminTodo) {
      await page.goto("http://localhost:4000/operations/" + a.path);
      await page.waitForTimeout(3000);
      await save(page, "auto-a-" + a.path.replace(/[^a-z0-9]+/gi, "-").toLowerCase(), { width: 1440, height: 900 }, { app: "admin", route: a.path, name: a.name });
    }
    await ctx.close();
  }
  writeFileSync(out + "auto.json", JSON.stringify(found, null, 1));
  if (found.length) console.log(`• ${found.length} screen(s) found in the code but not in spec.mjs; they appear in Figma under "Detected automatically".`);
  else console.log("• No undocumented screens found.");
  return found;
}
