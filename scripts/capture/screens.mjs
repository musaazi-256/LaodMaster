// Which spec screens to capture and how to reach each one in the running app.
// Screen ids match design/handoff/spec.mjs so the plugin swaps the capture in.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
const demoLogin = async (page) => {
  await page.getByText("Explore with a demo account").first().click();
  await page.waitForTimeout(3500);
};
const staffLoginAs = (identifier) => async (page) => {
  const r = await fetch("http://localhost:4000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password: "DemoCargo2026!", role: "staff" }),
  });
  const { token } = await r.json();
  await page.evaluate((t) => localStorage.setItem("loadmaster-admin-token", t), token);
};
const staffLogin = staffLoginAs("irene@loadmaster.test");

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

// Every other admin state: tabs, dialogs, menus and confirmations, plus each
// staff role's view. `doc` places the capture in the Figma admin page; these are
// captured-only (no hand-drawn fallback in spec.mjs).
const role = (email) => ({ ...A, key: "admin-" + email.split("@")[0], login: staffLoginAs(email) });
const BRIAN = "/drivers/driver-1";
const more = (item) => [{ button: "More actions" }, { menu: item }];
const st = (id, section, name, route, purpose, path, steps = [], extra = {}) => ({ id, app: A, path, steps, doc: { section, name, route, purpose }, ...extra });
const ADMIN_STATES = [
  // Access
  st("a-login-error", "Access", "Staff sign in · wrong password", "/operations (login)", "A wrong password keeps the form and shows the server's error under it.", "", [{ type: "not-the-password", nth: 1 }, { button: "Sign in" }], { signedOut: true }),
  st("a-login-recover", "Access", "Forgot password", "/operations (login › recover)", "Enter the staff email or phone to get a one-time code.", "", [{ button: "Forgot your password?" }], { signedOut: true }),
  st("a-login-code", "Access", "Reset password · code", "/operations (login › code)", "The demo shows the code; staff enter it with a new password.", "", [{ button: "Forgot your password?" }, { button: "Continue", wait: 1500 }], { signedOut: true }),
  // Workspace
  st("a-my-profile", "Workspace", "My staff profile", "header › profile", "Opened from the name in the header: role, status, contact details and recent activity.", "/dashboard", [{ label: "View my staff profile" }]),
  st("a-my-profile-edit", "Workspace", "Edit my name & phone", "header › profile › edit", "Staff update their own name and phone.", "/dashboard", [{ label: "View my staff profile" }, { button: "Edit my name & phone" }]),
  st("a-my-password", "Workspace", "Change my password", "header › profile › password", "Current and new password; other sessions are signed out.", "/dashboard", [{ label: "View my staff profile" }, { button: "Change password" }]),
  st("a-trips-columns", "Workspace", "Trips · choose columns", "trips (columns menu)", "Every table can hide columns; the choice is remembered per table.", "/trips", [{ label: "Choose columns" }]),
  st("a-trip-issues", "Workspace", "Trip page · issues", "trips (page › Issues)", "Issues reported on a trip by the customer or driver, with replies.", "/trips/LM-7614E75B", [{ tab: /^Issues/ }]),
  st("a-trip-issue-reply", "Workspace", "Respond to trip issue", "trips (page › Issues › reply)", "Reply to the reporter and set the case status.", "/trips/LM-7614E75B", [{ tab: /^Issues/ }, { button: "Reply or resolve" }]),
  ...[["admin", "daniel", "Admin"], ["lead", "rita", "Team Lead"], ["agent", "peter", "Field Agent"], ["care", "joan", "Customer Care"]].map(([k, who, name]) =>
    st("a-view-" + k, "Workspace", "Signed in as " + name, "dashboard (" + name + ")", "What the " + name + " role sees: sections and actions without permission are not rendered at all.", "/dashboard", [], { app: role(who + "@loadmaster.test") }),
  ),
  // People & fleet
  st("a-driver-add", "People & fleet", "Add driver", "drivers (form dialog)", "Operations registers a driver; they set a password at first sign-in.", "/drivers", [{ button: /Add driver/ }]),
  st("a-customer-add", "People & fleet", "Add customer", "customers (form dialog)", "Operations registers a customer account.", "/customers", [{ button: /Add customer/ }]),
  st("a-driver-transactions", "People & fleet", "Driver page · transactions", "drivers (page › Transactions)", "Every money movement for the driver: earnings, payouts, fees and adjustments.", BRIAN, [{ tab: /^Transactions/ }]),
  st("a-driver-documents", "People & fleet", "Driver page · documents", "drivers (page › Documents)", "The four required documents with status, preview and review, plus upload on the driver's behalf.", BRIAN, [{ tab: /^Documents/ }]),
  st("a-driver-support", "People & fleet", "Driver page · support", "drivers (page › Support)", "Support cases raised by this driver.", BRIAN, [{ tab: /^Support/ }]),
  st("a-driver-notes", "People & fleet", "Driver page · notes", "drivers (page › Notes)", "Internal notes staff keep on the account.", BRIAN, [{ tab: /^Notes/ }]),
  st("a-driver-activity", "People & fleet", "Driver page · activity", "drivers (page › Activity)", "Audit events about this account.", BRIAN, [{ tab: /^Activity/ }]),
  st("a-person-edit", "People & fleet", "Edit account details", "drivers/customers (page › Edit details)", "Name, phone and email with a reason; duplicates are rejected.", BRIAN, [{ button: /Edit details/ }]),
  st("a-person-message", "People & fleet", "Send a message", "drivers/customers (page › Message)", "The message appears in the person's Updates in the app.", BRIAN, [{ button: /^Message/ }]),
  st("a-person-note", "People & fleet", "Add internal note", "drivers/customers (page › Notes › Add note)", "Staff-only note on the account.", BRIAN, [{ tab: /^Notes/ }, { button: /Add note/ }]),
  st("a-driver-edit-vehicle", "People & fleet", "Edit vehicle", "drivers (page › More › Edit vehicle)", "Make, plate and truck category; blocked during a trip.", BRIAN, more(/Edit vehicle/)),
  st("a-person-reset", "People & fleet", "Reset password · confirm", "drivers/customers (page › More › Reset password)", "Signs them out everywhere and sets a temporary password.", BRIAN, more(/Reset password/)),
  st("a-driver-offline", "People & fleet", "Set driver offline · confirm", "drivers (page › More › Set offline)", "Withdraws any open request; accepted trips stay assigned.", BRIAN, more(/Set offline/), { setup: online }),
  st("a-driver-revoke", "People & fleet", "Revoke verification · confirm", "drivers (page › More › Revoke verification)", "The driver goes offline until documents and vehicle are approved again.", BRIAN, more(/Revoke verification/)),
  st("a-person-suspend", "People & fleet", "Suspend account · confirm", "drivers/customers (page › More › Suspend)", "Signs them out and blocks sign-in until reactivated; active trips continue.", BRIAN, more(/Suspend account/)),
  st("a-person-deactivate", "People & fleet", "Deactivate account · confirm", "drivers/customers (page › More › Deactivate)", "Closes the account; records are kept and it can be reactivated.", BRIAN, more(/Deactivate account/)),
  st("a-driver-suspended", "People & fleet", "Driver page · suspended", "drivers (page, suspended)", "A suspended driver: status badge and Reactivate in More.", "/drivers/driver-105"),
  st("a-person-reactivate", "People & fleet", "Reactivate account · confirm", "drivers/customers (page › More › Reactivate)", "Lets a suspended or deactivated account sign in again.", "/drivers/driver-105", more(/Reactivate account/)),
  st("a-driver-pending", "People & fleet", "Driver page · awaiting verification", "drivers (page, unverified)", "A registered driver whose vehicle and documents still need approval.", "/drivers/driver-104", [{ tab: /^Documents/ }]),
  st("a-document-preview", "People & fleet", "Document preview", "drivers (page › Documents › Preview)", "The uploaded file as the driver sent it.", BRIAN, [{ tab: /^Documents/ }, { button: "Preview", wait: 1800 }]),
  st("a-document-review", "People & fleet", "Review document", "drivers (page › Documents › Review)", "Approve or reject with a note; the driver sees the result.", BRIAN, [{ tab: /^Documents/ }, { button: "Review" }]),
  st("a-document-remove", "People & fleet", "Remove document evidence · confirm", "drivers (page › Documents › Remove)", "Deletes an uploaded file (permission: Delete driver documents).", BRIAN, [{ tab: /^Documents/ }, { button: "Remove" }]),
  st("a-customer-trips", "People & fleet", "Customer page · trips", "customers (page /customers/:id)", "All trips for one customer, filterable by status.", "/customers/customer-1"),
  st("a-customer-support", "People & fleet", "Customer page · support", "customers (page › Support)", "Support cases the customer raised.", "/customers/customer-1", [{ tab: /^Support/ }]),
  st("a-customer-notes", "People & fleet", "Customer page · notes", "customers (page › Notes)", "Internal notes on the customer.", "/customers/customer-1", [{ tab: /^Notes/ }]),
  st("a-customer-activity", "People & fleet", "Customer page · activity", "customers (page › Activity)", "Audit events about the customer.", "/customers/customer-1", [{ tab: /^Activity/ }]),
  st("a-customer-more", "People & fleet", "Customer page · More actions", "customers (page › More)", "Reset password, suspend or deactivate a customer.", "/customers/customer-1", [{ button: "More actions" }]),
  // Money & control
  st("a-payout-review", "Money & control", "Review payout request", "payouts (form dialog)", "Approve for finance payment, mark paid or reject, always with a reason.", "/payouts", [{ button: "Review request" }]),
  st("a-transfer-new", "Money & control", "New transfer", "transfers (form dialog)", "Create a demo transfer between ledger accounts.", "/transfers", [{ button: /New transfer/ }]),
  st("a-recon-import", "Money & control", "Import settlement report", "reconciliation (form dialog)", "Load a provider settlement report to compare with LoadMaster records.", "/reconciliation", [{ button: /Import report/ }]),
  st("a-reward-new", "Money & control", "New reward", "rewards (form dialog)", "Create a referral or cashback reward for an account.", "/rewards", [{ button: /New reward/ }]),
  st("a-reward-pay", "Money & control", "Pay reward · confirm", "rewards (form dialog)", "Pays a pending reward into the account's wallet.", "/rewards", [{ button: "Pay reward" }]),
  // Management
  st("a-support-reply", "Management", "Reply to a support case", "support (form dialog)", "Reply to the customer or driver and set the case status.", "/support", [{ button: "Reply / resolve" }]),
  st("a-support-history", "Management", "Support case history", "support (row › history)", "The full conversation and status changes on one case.", "/support", [{ row: 0 }]),
  st("a-staff-invite", "Management", "Invite staff", "staff (form dialog)", "Name, email, phone and role; a temporary password is issued.", "/staff", [{ button: /Invite staff/ }]),
  st("a-staff-person", "Management", "Staff member", "staff (row › profile)", "A staff member's role, status and recent activity.", "/staff", [{ row: 1 }]),
  st("a-staff-edit", "Management", "Update staff account", "staff (form dialog)", "Change role or status; the change applies on their next request.", "/staff", [{ button: "Edit account" }]),
  st("a-staff-reset", "Management", "Reset staff credentials", "staff (form dialog)", "Issues a temporary password and signs them out.", "/staff", [{ button: "Reset" }]),
  st("a-role-new", "Management", "New role", "staff (role dialog)", "Name, description and permissions for a new role.", "/staff", [{ button: /New role/ }]),
  st("a-role-delete", "Management", "Delete role · confirm", "staff (role dialog)", "Refused while any staff member holds the role.", "/staff", [{ button: "Delete" }]),
  st("a-audit-event", "Management", "Audit event", "audit (row › detail)", "One recorded action: who, when, target and the full detail.", "/audit", [{ row: 0 }]),
  st("a-settings-pricing", "Management", "Edit pricing rules", "settings (form dialog)", "Platform fee, helper rate and driver response window for new trips.", "/settings", [{ button: "Edit pricing rules" }]),
];

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
  { id: "c-notifications", app: C, steps: [async (p) => p.getByLabel(/notification|updates/i).first().click()] },
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
  { id: "a-assign", app: A, steps: [...tripPage().steps, { button: "Manage assignment" }] },
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
  ...ADMIN_STATES,
  { id: "a-role-edit", app: A, path: "/staff", steps: [{ button: "Edit", nth: 0 }] },
  { id: "a-driver-detail", app: A, path: "/drivers/driver-1" },
  { id: "a-driver-profile", app: A, path: "/drivers/driver-1", steps: [{ click: "Profile", exact: true }] },
  { id: "a-driver-more", app: A, path: "/drivers/driver-1", steps: [{ click: "More", exact: true }] },
  { id: "a-driver-requests", app: A, path: "/drivers/driver-1", steps: [{ click: "Requests", exact: true }] },
  { id: "a-customer-detail", app: A, path: "/customers/customer-1", steps: [{ tab: /^Transactions/ }] },
  { id: "a-customer-profile", app: A, path: "/customers/customer-1", steps: [{ click: "Profile", exact: true }] },
];
