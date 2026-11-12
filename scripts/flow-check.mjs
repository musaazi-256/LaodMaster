import { chromium } from "@playwright/test";
import { createServer } from "../services/demo/server.mjs";
import { CargoStore } from "../services/demo/cargo.mjs";
import { mkdirSync } from "node:fs";
// Cross-app run-through: customer orders, a driver declines, another accepts
// and delivers, the customer pays and rates, then operations opens the trip,
// customer and driver pages. Screenshots go to audits/flow.
const out = process.argv[2] || "audits/flow";
mkdirSync(out, { recursive: true });
let failed = false;
const store = new CargoStore();
const server = createServer(store);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const call = async (path, token, body, headers = {}) => {
  const r = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok)
    throw Object.assign(new Error(path + ": " + j.error?.message), {
      code: j.error?.code,
    });
  return j;
};
const log = (...a) => console.log("•", ...a);
try {
  const C = "demo-customer-1";
  await call("/availability", "demo-driver-1", { online: true });
  await call("/availability", "demo-driver-2", { online: true }).catch((e) =>
    log("driver-2 online:", e.message),
  );
  const q = await call("/quotes", C, {
    pickupId: "ntinda",
    destinationId: "kololo",
    truckId: "small",
  });
  const o = await call(
    "/orders",
    C,
    { quoteId: q.id, method: "mtn" },
    { "Idempotency-Key": "e2e-" + Date.now() },
  );
  log("customer placed", o.id, "stage", o.stage);
  const staff = (
    await call("/auth/login", "", {
      identifier: "irene@loadmaster.test",
      password: "DemoCargo2026!",
      role: "staff",
    }).catch(async () =>
      call("/auth/login", "", {
        email: "irene@loadmaster.test",
        password: "DemoCargo2026!",
        role: "staff",
      }),
    )
  ).token;
  const adminOrder = async () =>
    (await call("/admin", staff)).orders.find((x) => x.id === o.id);
  let a = await adminOrder();
  log(
    "admin sees",
    a.stage,
    "dispatch:",
    a.dispatch.map((e) => e.driverId + ":" + e.status).join(", "),
  );
  const first = a.dispatch.at(-1).driverId;
  const s1 = await call("/snapshot", "demo-" + first);
  log(
    first,
    "has offer:",
    s1.offers.map((x) => x.id).join(","),
    "expires",
    s1.offers[0]?.offer?.expiresAt,
  );
  await call(`/orders/${o.id}/decline`, "demo-" + first, {
    reason: "Too far from me",
  });
  a = await adminOrder();
  log(
    "after decline, admin dispatch:",
    a.dispatch
      .map(
        (e) =>
          e.driverId + ":" + e.status + (e.reason ? "(" + e.reason + ")" : ""),
      )
      .join(", "),
  );
  const cust = await call("/snapshot", C);
  log(
    "customer still sees stage",
    cust.orders.find((x) => x.id === o.id).stage,
  );
  const hist = await call("/snapshot", "demo-" + first);
  log(
    first,
    "request history:",
    hist.requestHistory.map((h) => h.orderId + ":" + h.status).join(", "),
  );
  const next = a.dispatch.find((e) => e.status === "offered")?.driverId;
  log("next offered:", next);
  const driver = next || first;
  if (!next) {
    // nobody else eligible: ops assigns the decliner? use admin dispatch to driver-1
    await call("/admin/dispatch", staff, {
      id: o.id,
      driverId: "driver-1",
      reason: "Only available truck",
    });
  } else await call(`/orders/${o.id}/accept`, "demo-" + driver, {});
  a = await adminOrder();
  log("assigned to", a.driverId, "stage", a.stage);
  const cs = (await call("/snapshot", C)).orders.find((x) => x.id === o.id);
  log(
    "customer sees",
    cs.stage,
    "driver",
    (await call("/snapshot", C)).people.find((p) => p.id === a.driverId)?.name,
  );
  for (const stage of ["to_pickup", "at_pickup", "loading", "in_transit"]) {
    await call(`/orders/${o.id}/advance`, "demo-" + a.driverId, {
      stage,
      confirmed: true,
    });
  }
  log(
    "customer stage now",
    (await call("/snapshot", C)).orders.find((x) => x.id === o.id).stage,
    "· admin",
    (await adminOrder()).stage,
  );
  const route = await call("/routes", staff, { orderId: o.id });
  log(
    "admin route:",
    route.source,
    route.coordinates.length,
    "points",
    route.distanceKm?.toFixed?.(1) ?? "",
    "km",
  );
  // second order delivered + paid, third cancelled, for history
  const live = o.id;
  for (const stage of ["at_destination", "offloading", "delivered"])
    await call(`/orders/${o.id}/advance`, "demo-" + a.driverId, {
      stage,
      confirmed: true,
    });
  await call(`/orders/${o.id}/payment`, C, {
    action: "approve",
    scenario: "success",
    method: "mtn",
  }).catch((e) => log("pay:", e.message));
  log(
    "after delivery: payment",
    (await adminOrder()).payment.status,
    "payout",
    (await adminOrder()).financial.payoutStatus,
  );
  await call(`/account/rating`, C, {
    orderId: o.id,
    rating: 4,
    review: "On time",
  }).catch((e) => log("rate:", e.message));
  const q2 = await call("/quotes", C, {
    pickupId: "nakawa",
    destinationId: "city",
    truckId: "small",
  }).catch(() =>
    call("/quotes", C, {
      pickupId: "nakawa",
      destinationId: "kololo",
      truckId: "small",
    }),
  );
  const o2 = await call(
    "/orders",
    C,
    { quoteId: q2.id, method: "mtn" },
    { "Idempotency-Key": "e2e2-" + Date.now() },
  );
  await call(`/orders/${o2.id}/cancel`, C, { reason: "Plans changed" });
  log("cancelled", o2.id);
  const q3 = await call("/quotes", C, {
    pickupId: "kololo",
    destinationId: "ntinda",
    truckId: "small",
  });
  const o3 = await call(
    "/orders",
    C,
    { quoteId: q3.id, method: "mtn" },
    { "Idempotency-Key": "e2e3-" + Date.now() },
  );
  await call("/snapshot", "demo-driver-1");
  const d3 = (await call("/admin", staff)).orders
    .find((x) => x.id === o3.id)
    .dispatch.find((e) => e.status === "offered")?.driverId;
  if (d3) {
    await call(`/orders/${o3.id}/accept`, "demo-" + d3, {});
    for (const stage of ["to_pickup", "at_pickup", "loading", "in_transit"])
      await call(`/orders/${o3.id}/advance`, "demo-" + d3, {
        stage,
        confirmed: true,
      });
  }
  log("live trip", o3.id, "driver", d3);
  // admin management
  await call("/admin/note", staff, {
    id: "customer-1",
    text: "Prefers phone calls before pickup.",
  });
  const reset = await call("/admin/user", staff, {
    id: "customer-1",
    resetPassword: true,
    reason: "Customer locked out",
  });
  log("reset → temp password", reset.demoTemporaryPassword);

  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROME_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: [
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on(
    "console",
    (m) =>
      (m.type() === "error" || m.type() === "warning") && errors.push(m.text()),
  );
  await page.goto(base + "/operations/");
  await page.evaluate(
    (t) => localStorage.setItem("loadmaster-admin-token", t),
    staff,
  );
  await page.goto(base + "/operations/trips");
  await page.waitForSelector("text=" + o3.id);
  await page.screenshot({ path: out + "/trips.png" });
  await page.locator("tr", { hasText: o3.id }).first().click();
  await page.waitForTimeout(1500);
  log("row click goes to", new URL(page.url()).pathname);
  await page.waitForTimeout(7000);
  await page.screenshot({ path: out + "/trip-live.png", fullPage: true });
  await page.goto(base + "/operations/trips/" + live);
  await page.waitForTimeout(7000);
  await page.screenshot({ path: out + "/trip-done.png", fullPage: true });
  await page.click(".party-card >> nth=0");
  await page.waitForTimeout(800);
  log("customer card goes to", new URL(page.url()).pathname);
  await page.waitForTimeout(800);
  await page.screenshot({ path: out + "/customer.png", fullPage: true });
  await page.getByRole("tab", { name: /Transactions/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: out + "/customer-tx.png", fullPage: true });
  await page.goto(base + "/operations/drivers/" + a.driverId);
  await page.waitForTimeout(800);
  await page.screenshot({ path: out + "/driver.png", fullPage: true });
  await page.getByRole("tab", { name: /Requests/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: out + "/driver-requests.png", fullPage: true });
  // clicking a driver name in the trips table
  await page.goto(base + "/operations/trips");
  await page.waitForSelector(".person-link");
  await page.locator(".person-link").nth(1).click();
  log("name click goes to", new URL(page.url()).pathname);

  // Trips: status filters and search across linked people.
  for (const id of ["driver-3", "driver-4"])
    await call("/availability", "demo-" + id, { online: true });
  await page.goto(base + "/operations/trips");
  await page.waitForSelector(".filter-chip");
  log(
    "trip filters:",
    (await page.locator(".filter-chip").allInnerTexts())
      .map((t) => t.replace(/\s+/g, " "))
      .join(" | "),
  );
  await page.getByRole("tab", { name: /Cancelled/ }).click();
  await page.waitForTimeout(300);
  log(
    "cancelled rows:",
    await page.locator("tbody tr").count(),
    new URL(page.url()).search,
  );
  await page.getByRole("tab", { name: /All trips/ }).click();
  for (const q of [
    "UBB 920",
    "700 000 111",
    "sarah@example.test",
    "driver-1",
  ]) {
    await page.getByLabel("Search table").fill(q);
    await page.waitForTimeout(150);
    log(`search "${q}":`, await page.locator("tbody tr").count(), "rows");
  }
  await page.screenshot({ path: out + "/trips-filters.png", fullPage: true });

  // Driver tracking: counts, map, search, select a driver on a trip.
  await page.goto(base + "/operations/trips?view=tracking");
  await page.waitForTimeout(5000);
  log(
    "fleet counts:",
    (await page.locator(".fleet-metrics .metric-value").allInnerTexts()).join(
      " / ",
    ),
    "(online / on trip / available / offline)",
  );
  log("pins on map:", await page.locator(".fleet-pin").count());
  await page.screenshot({ path: out + "/tracking.png", fullPage: true });
  await page.getByLabel("Find a driver").fill("UBB");
  await page.locator(".fleet-list button").first().click();
  await page.waitForTimeout(2500);
  log(
    "selected panel:",
    (await page.locator(".fleet-detail").innerText())
      .split("\n")
      .slice(0, 3)
      .join(" · "),
  );
  await page.screenshot({
    path: out + "/tracking-selected.png",
    fullPage: true,
  });

  // Drivers list.
  await page.goto(base + "/operations/drivers");
  await page.waitForSelector(".filter-chip");
  await page.screenshot({ path: out + "/drivers.png", fullPage: true });
  const real = errors.filter(
    (e) =>
      !/tiles|Failed to load resource|ERR_|GL Driver|Expected value to be of type/.test(
        e,
      ),
  );
  log("browser errors:", real.join(" | ") || "none");
  if (real.length) failed = true;
  await browser.close();
} catch (e) {
  failed = true;
  console.error("FAILED", e.code || "", e.message);
} finally {
  server.close();
  process.exitCode = failed ? 1 : 0;
}
