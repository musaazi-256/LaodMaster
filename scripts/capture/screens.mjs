// Which spec screens to capture and how to reach each one in the running app.
// Screen ids match design/handoff/spec.mjs so the plugin swaps the capture in.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
const demoLogin = async (page) => {
  await page.getByText("Explore with a demo account").first().click();
  await page.waitForTimeout(3500);
};
const staffLogin = async (page) => {
  const r = await fetch("http://localhost:4000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "irene@loadmaster.test", password: "DemoCargo2026!", role: "staff" }),
  });
  const { token } = await r.json();
  await page.evaluate((t) => localStorage.setItem("loadmaster-admin-token", t), token);
};

export const APPS = {
  customer: { key: "customer", kind: "mobile", url: "http://localhost:8191", login: demoLogin },
  driver: { key: "driver", kind: "mobile", url: "http://localhost:8192", login: demoLogin },
  admin: { key: "admin", kind: "admin", url: "http://localhost:4000/operations", login: staffLogin },
};

const go = (text, wait = 1500) => ({ click: text, wait });
const tab = (name) => ({ click: name, exact: true, wait: 1200 });
const C = APPS.customer;
const D = APPS.driver;
const A = APPS.admin;
const offline = (api) => api("/availability", "demo-driver-1", { online: false }).catch(() => undefined);
const online = (api) => api("/availability", "demo-driver-1", { online: true });

// One live order walked through every stage; captures happen along the way.
const LIVE = tmpdir() + "/loadmaster-capture-live.json";
// Remembered between runs so a single stage can be re-captured.
const live = existsSync(LIVE) ? JSON.parse(readFileSync(LIVE, "utf8")) : { id: null };
let staffToken = null;
const staff = async () => {
  if (staffToken) return staffToken;
  const r = await fetch("http://localhost:4000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "irene@loadmaster.test", password: "DemoCargo2026!", role: "staff" }),
  });
  return (staffToken = (await r.json()).token);
};
const placeOrder = async (api) => {
  await online(api);
  // The demo allows one active order per customer: clear leftovers first.
  const snap = await api("/snapshot", "demo-customer-1");
  for (const o of snap.orders || [])
    if (!["delivered", "cancelled", "completed"].includes(o.stage))
      await api(`/orders/${o.id}/cancel`, "demo-customer-1", { reason: "Changed my plans" }).catch(() => undefined);
  const q = await api("/quotes", "demo-customer-1", { pickupId: "ntinda", destinationId: "kololo", truckId: "small" });
  const o = await api("/orders", "demo-customer-1", { quoteId: q.id, method: "mtn" });
  live.id = o.id;
  writeFileSync(LIVE, JSON.stringify(live));
  // Pass the request along until it reaches Brian (driver-1), the demo driver app's account.
  for (let i = 0; i < 12; i++) {
    const a = (await api("/admin", await staff())).orders.find((x) => x.id === live.id);
    const offered = a?.dispatch?.find((e) => e.status === "offered")?.driverId;
    if (!offered || offered === "driver-1") break;
    await api(`/orders/${live.id}/decline`, "demo-" + offered, { reason: "Too far from me" }).catch(() => undefined);
  }
};
const advance = (...stages) => async (api) => {
  for (const stage of stages) await api(`/orders/${live.id}/advance`, "demo-driver-1", { stage, ...(stage === "delivered" ? { confirmed: true } : {}) });
};
const openOrder = (tabName) => [tab(tabName), async (p) => p.getByText(live.id).first().click(), { wait: 2500 }];
const tripPage = (tabName) => ({ steps: [async (p) => p.goto("http://localhost:4000/operations/trips/" + live.id), { wait: 3000 }, ...(tabName ? [{ click: tabName }] : [])] });
const W = (n) => [go("Continue", 2500), ...["Cargo & contacts", "Payment & pairing", "Review order"].slice(0, n - 1).map((t) => go(t, 2500))];
const banner = go("Review request", 2500);

export const SCREENS = [
  // Customer
  { id: "c-signin", app: C, signedOut: true },
  { id: "c-register", app: C, signedOut: true, steps: [go("Create account")] },
  { id: "c-recover", app: C, signedOut: true, steps: [go("Forgot password?")] },
  { id: "c-home", app: C },
  { id: "c-wallet", app: C, steps: [go("Add funds")] },
  { id: "c-locations", app: C, steps: [go("Order a cargo truck", 2500)] },
  { id: "c-orders", app: C, steps: [tab("Orders")] },
  { id: "c-order-details", app: C, steps: [tab("Orders"), go("LM-", 3000)] },
  { id: "c-payments", app: C, steps: [tab("Payments")] },
  { id: "c-account", app: C, steps: [tab("Account")] },
  { id: "c-profile", app: C, steps: [tab("Account"), go("Your profile")] },
  { id: "c-support", app: C, steps: [tab("Account"), go("Help & support")] },
  { id: "c-payment-methods", app: C, steps: [tab("Account"), go("Payment methods")] },
  { id: "c-saved-places", app: C, steps: [tab("Account"), go("Saved places")] },
  { id: "c-preferences", app: C, steps: [tab("Account"), go("More account options", 800), go("Settings & privacy")] },
  { id: "c-notifications", app: C, steps: [async (p) => p.getByLabel(/notification/i).first().click()] },
  // Driver
  { id: "d-signin", app: D, signedOut: true },
  { id: "d-register", app: D, signedOut: true, steps: [go("Create account")] },
  { id: "d-home-offline", app: D, setup: offline },
  // Online with the demo's open requests waiting: the request banner shows on Home.
  { id: "d-home-offer", app: D, setup: online, teardown: offline },
  { id: "d-deliveries", app: D, steps: [tab("Deliveries")] },
  { id: "d-request-history", app: D, steps: [tab("Deliveries"), go("Request history")] },
  { id: "d-earnings", app: D, steps: [tab("Earnings")] },
  { id: "d-payouts", app: D, steps: [tab("Earnings"), go("Request or view scheduled payout")] },
  { id: "d-account", app: D, steps: [tab("Account")] },
  { id: "d-verification", app: D, steps: [tab("Account"), go("Vehicle & verification")] },
  { id: "d-notifications", app: D, steps: [async (p) => p.getByLabel(/notification|update/i).first().click()] },
  // Order wizard (Continue through the steps)
  { id: "c-wiz-truck", app: C, steps: [go("Order a cargo truck", 2500), ...W(1)] },
  { id: "c-wiz-cargo", app: C, steps: [go("Order a cargo truck", 2500), ...W(2)] },
  { id: "c-wiz-pay", app: C, steps: [go("Order a cargo truck", 2500), ...W(3)] },
  { id: "c-wiz-review", app: C, steps: [go("Order a cargo truck", 2500), ...W(4)] },
  { id: "a-login", app: A, signedOut: true },
  { id: "d-vehicle", app: D, steps: [tab("Account"), go("Vehicle & verification"), go("Edit vehicle details")] },
  // Live order: searching → offer → accepted → pickup → transit → handover → delivered
  { id: "c-order-searching", app: C, setup: placeOrder, steps: openOrder("Orders") },
  { id: "c-home-active", app: C },
  // Offers expire after ~30 s, so the driver screens use a fresh order, back to back.
  { id: "d-offer", app: D, setup: placeOrder, steps: [banner] },
  { id: "d-decline", app: D, steps: [banner, go("Decline request")] },
  { id: "d-done-accepted", app: D, steps: [banner, go("Accept this order", 900)], settle: 0 },
  { id: "a-trip-dispatch", app: A, ...tripPage("Driver requests") },
  { id: "c-order-assigned", app: C, steps: openOrder("Orders") },
  { id: "d-order-pickup", app: D, setup: advance("to_pickup", "at_pickup"), steps: openOrder("Deliveries") },
  { id: "c-chat", app: C, steps: [...openOrder("Orders"), go("Messages & quick replies", 2000)] },
  { id: "c-order-transit", app: C, setup: advance("loading", "in_transit"), steps: openOrder("Orders") },
  { id: "a-trip-details", app: A, ...tripPage() },
  { id: "a-trip-timeline", app: A, ...tripPage("Timeline") },
  { id: "a-tracking-selected", app: A, path: "/trips?view=tracking", steps: [async (p) => p.getByText("Brian Kato").first().click(), { wait: 2000 }] },
  { id: "d-order-handover", app: D, setup: advance("at_destination", "offloading"), steps: openOrder("Deliveries") },
  { id: "c-order-delivered", app: C, setup: advance("delivered"), steps: openOrder("Orders") },
  { id: "c-payment-due", app: C, steps: [...openOrder("Orders"), go("View payment details", 2500)] },
  { id: "a-trip-payments", app: A, ...tripPage("Payments & actions") },

  // Admin
  ...[
    ["a-dashboard", "/dashboard"],
    ["a-trips", "/trips"],
    ["a-tracking", "/trips?view=tracking"],
    ["a-drivers", "/drivers"],
    ["a-customers", "/customers"],
    ["a-payments", "/payments"],
    ["a-payouts", "/payouts"],
    ["a-transfers", "/transfers"],
    ["a-reconciliation", "/reconciliation"],
    ["a-methods", "/methods"],
    ["a-rewards", "/rewards"],
    ["a-support", "/support"],
    ["a-staff", "/staff"],
    ["a-audit", "/audit"],
    ["a-reports", "/reports"],
    ["a-settings", "/settings"],
  ].map(([id, path]) => ({ id, app: A, path })),
  { id: "a-driver-detail", app: A, path: "/drivers/driver-1" },
  { id: "a-driver-profile", app: A, path: "/drivers/driver-1", steps: [{ click: "Profile", exact: true }] },
  { id: "a-driver-more", app: A, path: "/drivers/driver-1", steps: [{ click: "More", exact: true }] },
  { id: "a-driver-requests", app: A, path: "/drivers/driver-1", steps: [{ click: "Requests", exact: true }] },
  { id: "a-customer-detail", app: A, path: "/customers/customer-1" },
  { id: "a-customer-profile", app: A, path: "/customers/customer-1", steps: [{ click: "Profile", exact: true }] },
];
