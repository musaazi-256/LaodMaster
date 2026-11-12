// Screenshots of the main admin pages with the full demo data set, for
// design review. Output: audits/design/*.png
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { createServer } from "../services/demo/server.mjs";
import { CargoStore } from "../services/demo/cargo.mjs";
import { populate } from "../services/demo/demo-data.mjs";
const out = process.argv[2] || "audits/design";
mkdirSync(out, { recursive: true });
const store = new CargoStore();
populate(store);
const server = createServer(store);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const token = (
  await (
    await fetch(base + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "irene@loadmaster.test",
        password: "DemoCargo2026!",
        role: "staff",
      }),
    })
  ).json()
).token;
const trip = store.state.orders.find((o) => o.stage === "in_transit");
const done = store.state.orders.find(
  (o) => o.stage === "delivered" && o.rating && o.dispatch.length > 1,
);
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const errors = [];
try {
  for (const [w, h, suffix] of [
    [1440, 900, ""],
    [390, 844, "-mobile"],
  ]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/operations/");
    await page.evaluate(
      (t) => localStorage.setItem("loadmaster-admin-token", t),
      token,
    );
    const pages = suffix
      ? ["dashboard", "trips", "drivers/driver-101"]
      : [
          "dashboard",
          "trips",
          "trips?view=tracking",
          "trips/" + trip.id,
          "trips/" + done.id,
          "drivers",
          "drivers/driver-101",
          "customers",
          "customers/" + done.customerId,
          "payments",
          "payouts",
          "transfers",
          "reconciliation",
          "methods",
          "rewards",
          "support",
          "staff",
          "audit",
          "reports",
          "settings",
        ];
    for (const path of pages) {
      await page.goto(base + "/operations/" + path);
      await page.waitForTimeout(path.includes("trips") ? 4000 : 1200);
      const name = path.replace(/[/?=]/g, "-").replace(/-LM-.*/, "-detail");
      await page.screenshot({
        path: `${out}/${name}${path === "trips/" + done.id ? "-done" : ""}${suffix}.png`,
        fullPage: !path.includes("tracking"),
      });
    }
    await page.close();
  }
  console.log("errors:", errors.join(" | ") || "none");
} finally {
  await browser.close();
  server.close();
}
