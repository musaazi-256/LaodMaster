import { chromium, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { CargoStore } from "../services/demo/cargo.mjs";
import { createServer } from "../services/demo/server.mjs";
const store = new CargoStore();
store.availability("driver-1", { online: true });
for (let i = 0; i < 16; i++) {
  const q = store.quote("customer-1", {
    pickupId: "ntinda",
    destinationId: i % 2 ? "kololo" : "nakawa",
    truckId: "small",
    loading: i % 3,
    offloading: 0,
  });
  const order = store.create(
    "customer-1",
    { quoteId: q.id, method: i % 2 ? "card" : "mtn" },
    "table-check-order-" + i,
  );
  store.accept("driver-1", order.id);
  for (const stage of [
    "to_pickup",
    "at_pickup",
    "loading",
    "in_transit",
    "at_destination",
    "offloading",
    "delivered",
  ])
    store.advance("driver-1", order.id, { stage, confirmed: true });
  store.payment("customer-1", order.id, {
    action: "approve",
    scenario: "success",
  });
}
const server = createServer(store);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--no-sandbox"],
});
const errors = [];
const path = "audits/v2/admin-tables";
mkdirSync(path, { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/operations`);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("link", { name: "Collections", exact: true }).click();
  const table = page.getByRole("table").first();
  await expect(table).toBeVisible();
  await expect(table.locator("tbody tr")).toHaveCount(10);
  const tools = await page.locator(".table-tool-button").evaluateAll((nodes) =>
    nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { width: r.width, height: r.height, y: r.y };
    }),
  );
  if (
    tools.some((t) => t.width !== 36 || t.height !== 36) ||
    tools[0].y !== tools[1].y
  )
    throw Error("Table tools do not share their size/alignment");
  await page.screenshot({
    path: path + "/collections-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(table.locator("tbody tr")).toHaveCount(6);
  await page
    .getByRole("button", { name: "Choose columns", exact: true })
    .click();
  await page
    .getByRole("menuitemcheckbox", { name: "Fare", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    table.getByRole("columnheader", { name: "Fare", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page
      .getByRole("table")
      .first()
      .getByRole("columnheader", { name: "Fare", exact: true }),
  ).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  const csv = await download;
  const stream = await csv.createReadStream();
  let content = "";
  for await (const chunk of stream) content += chunk;
  if (content.split("\n")[0].includes("Fare"))
    throw Error("CSV includes a hidden column");
  await page
    .getByRole("button", { name: "Choose columns", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Show all columns", exact: true })
    .click();
  await expect(
    page.getByRole("columnheader", { name: "Fare", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search table", exact: true })
    .fill("no-matching-loadmaster-record");
  await expect(
    page.getByText("No matching records", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear table search", exact: true })
    .click();
  await expect(table.locator("tbody tr")).toHaveCount(10);
  for (const name of [
    "Trips",
    "Drivers & vehicles",
    "Customers",
    "Collections",
    "Driver payouts",
    "Transfers & ledger",
    "Reconciliation",
    "Payment methods",
    "Referrals & cashbacks",
    "Support & disputes",
    "Staff & roles",
    "Audit trail",
    "Reports",
  ]) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page.locator("main h1")).toBeVisible();
    const metrics = await page.locator("table").evaluateAll((tables) =>
      tables.map((t) => ({
        header: [...t.querySelectorAll("thead th")].filter((c) => !c.hidden)
          .length,
        rows: [...t.querySelectorAll("tbody tr")].map((r) => ({
          cells: [...r.children].filter((c) => !c.hidden).length,
          height: r.getBoundingClientRect().height,
        })),
        headerHeight: t.querySelector("thead")?.getBoundingClientRect().height,
      })),
    );
    for (const m of metrics) {
      if (m.headerHeight !== 40)
        throw Error(name + ": header height " + m.headerHeight);
      if (m.rows.some((r) => r.cells !== m.header || r.height > 61))
        throw Error(name + ": inconsistent row density/cells");
    }
  }
  await page.getByRole("link", { name: "Trips", exact: true }).click();
  await page.screenshot({
    path: path + "/orders-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await expect(
    page.getByRole("link", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Driver tracking", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Driver tracking", exact: true }).click();
  await expect(page.getByText("Online drivers", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/trips\?view=tracking$/);
  await expect(
    page.getByRole("tab", { name: "Driver tracking", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.screenshot({
    path: path + "/trips-tracking-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  for (const [legacy, target] of [
    ["overview", "dashboard"],
    ["orders", "trips"],
    ["tracking", "trips?view=tracking"],
  ]) {
    await page.goto(
      `http://127.0.0.1:${server.address().port}/operations/` + legacy,
    );
    await expect(page).toHaveURL(
      `http://127.0.0.1:${server.address().port}/operations/` + target,
    );
  }
  await page.getByRole("tab", { name: "Trip records", exact: true }).click();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  const theme = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    return [
      "--primary",
      "--background",
      "--foreground",
      "--color-muted-foreground",
      "--color-border",
    ].map((k) => css.getPropertyValue(k).trim().toLowerCase());
  });
  if (
    JSON.stringify(theme) !==
    JSON.stringify(["#087443", "#fafbfa", "#111827", "#6b7280", "#e5e7eb"])
  )
    throw Error("Admin theme differs from LoadMaster app colors: " + theme);
  await expect(page.locator(".chart .recharts-surface")).toBeVisible();
  await page.screenshot({
    path: path + "/dashboard-loadmaster-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("link", { name: "Trips", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator("main h1")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  if (overflow) throw Error("Page-level horizontal overflow on mobile");
  const region = page
    .getByRole("region", { name: "Scrollable data table", exact: true })
    .first();
  await expect(region).toBeVisible();
  await region.evaluate((el) => (el.scrollLeft = el.scrollWidth));
  await page.screenshot({
    path: path + "/orders-mobile-scrolled.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Choose columns", exact: true })
    .click();
  await page.screenshot({
    path: path + "/columns-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Driver tracking", exact: true }).click();
  await expect(page.getByText("Online drivers", { exact: true })).toBeVisible();
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw Error("Tracking overflows on mobile");
  await page.screenshot({
    path: path + "/trips-tracking-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  for (const [identifier, expectedPage, hasTrips] of [
    ["joan@loadmaster.test", "trips", true],
    ["peter@loadmaster.test", "drivers", false],
  ]) {
    const result = store.auth("login", {
      role: "staff",
      identifier,
      password: "DemoCargo2026!",
    });
    const roleContext = await browser.newContext();
    await roleContext.addInitScript(
      (token) => localStorage.setItem("loadmaster-admin-token", token),
      result.token,
    );
    const rolePage = await roleContext.newPage();
    rolePage.on("pageerror", (e) => errors.push(e.message));
    await rolePage.goto(
      `http://127.0.0.1:${server.address().port}/operations/trips?view=tracking`,
    );
    await expect(rolePage).toHaveURL(
      new RegExp("/" + expectedPage + "(?:\\?.*)?$"),
    );
    await expect(
      rolePage.getByRole("tab", { name: "Driver tracking", exact: true }),
    ).toHaveCount(0);
    await expect(
      rolePage.getByRole("link", { name: "Trips", exact: true }),
    ).toHaveCount(hasTrips ? 1 : 0);
    await expect(
      rolePage.getByRole("link", { name: "Collections", exact: true }),
    ).toHaveCount(0);
    await roleContext.close();
  }
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "Admin tables passed: compact density, 36px controls, pagination, column persistence, visible-column CSV, search/clear, 13 portal sections, mobile scrolling, Dashboard/Trips redirects, shared app colors and scoped Trips/tracking access.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
