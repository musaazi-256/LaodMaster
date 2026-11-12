// Opens the admin portal as each staff role and records what is rendered,
// to check the Account Management spec's "hidden, not disabled" rule.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { createServer } from "../services/demo/server.mjs";
import { CargoStore } from "../services/demo/cargo.mjs";
const out = process.argv[2] || "audits/roles";
mkdirSync(out, { recursive: true });
const store = new CargoStore();
const server = createServer(store);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const login = async (email) => {
  const r = await fetch(base + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: email,
      password: "DemoCargo2026!",
      role: "staff",
    }),
  });
  return (await r.json()).token;
};
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
let failed = false;
try {
  for (const [role, email] of [
    ["field-agent", "peter@loadmaster.test"],
    ["customer-care", "joan@loadmaster.test"],
    ["admin", "daniel@loadmaster.test"],
  ]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const token = await login(email);
    await page.goto(base + "/operations/");
    await page.evaluate(
      (t) => localStorage.setItem("loadmaster-admin-token", t),
      token,
    );
    for (const path of [
      "dashboard",
      "drivers/driver-1",
      "customers/customer-1",
    ]) {
      await page.goto(base + "/operations/" + path);
      await page.waitForTimeout(900);
      const nav = await page.locator(".nav-link").allInnerTexts();
      const tabs = await page.locator('[role="tab"]').allInnerTexts();
      const buttons = await page
        .locator(".person-actions button")
        .allInnerTexts();
      const url = new URL(page.url()).pathname;
      console.log(
        `• ${role} ${path} → ${url}\n    nav: ${nav.join(", ")}\n    tabs: ${tabs.join(", ") || "—"}\n    actions: ${buttons.join(", ") || "—"}`,
      );
      await page.screenshot({
        path: `${out}/${role}-${path.replace("/", "-")}.png`,
        fullPage: true,
      });
    }
    await page.close();
  }
} catch (e) {
  failed = true;
  console.error("FAILED", e.message);
} finally {
  await browser.close();
  server.close();
  process.exitCode = failed ? 1 : 0;
}
