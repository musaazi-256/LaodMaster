// Documented journeys: performs each flow for real in the running apps and
// captures the screen after every action, so Figma shows the flow exactly as
// it happens.  node scripts/capture/journeys.mjs [journey-id,...]
// Writes design/handoff/captures/j-*.json and captures/journeys.json (flows).
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { glyphSvg, isIconFont } from "./glyphs.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const out = root + "design/handoff/captures/";
mkdirSync(out, { recursive: true });
const extract = readFileSync(new URL("./extract.js", import.meta.url), "utf8").replace(/^(\s*\/\/[^\n]*\n)+/, "").trim().replace(/;$/, "");
const URLS = { customer: "http://localhost:8191", driver: "http://localhost:8192", admin: "http://localhost:4000/operations" };
const VIEW = { customer: { width: 390, height: 844 }, driver: { width: 390, height: 844 }, admin: { width: 1440, height: 900 } };
const BASE = "http://localhost:4000";
const PASSWORD = "DemoCargo2026!";

const api = async (path, token, body) => {
  const r = await fetch(BASE + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), "Idempotency-Key": "j-" + Date.now() + Math.random() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(path + ": " + (j.error?.message || r.status));
  return j;
};
const login = async (identifier, role, password = PASSWORD) => (await api("/auth/login", "", { identifier, password, role })).token;

function iconsToSvg(n) {
  for (const [i, k] of (n.kids || []).entries()) {
    if (k.k === "text" && isIconFont(k.st.f)) {
      const g = glyphSvg(k.st.f, k.t, k.st.s, k.st.c, k.w, k.h);
      if (g) n.kids[i] = { k: "svg", n: "Icon", x: k.x, y: k.y, w: g.w, h: k.h, svg: g.svg };
    } else iconsToSvg(k);
  }
}

// ------------------------------------------------------------------ runner
const browser = await chromium.launch({ channel: "chrome" });
const shots = process.env.CAPTURE_SHOTS;

async function run(j) {
  const pages = {};
  const ctx = { vars: {} };
  const page = async (app, signedOut = false) => {
    if (pages[app]) return pages[app];
    const c = await browser.newContext({ viewport: VIEW[app], deviceScaleFactor: 2 });
    const p = await c.newPage();
    await p.goto(URLS[app]);
    await p.waitForTimeout(2500);
    if (app === "admin") {
      const token = await login("irene@loadmaster.test", "staff");
      await p.evaluate((t) => localStorage.setItem("loadmaster-admin-token", t), token);
      await p.goto(URLS.admin + "/dashboard");
      await p.waitForTimeout(2500);
    } else if (!signedOut) {
      await p.getByText("Explore with a demo account").first().click();
      await p.waitForTimeout(3500);
    }
    pages[app] = p;
    return p;
  };
  ctx.page = page;
  if (j.setup) await j.setup(ctx);
  const steps = [];
  let n = 0;
  for (const st of j.steps) {
    try {
      if (st.lane !== "system") {
        const p = await page(st.lane, st.signedOut);
        if (st.act) await st.act(p, ctx);
        await p.waitForTimeout(st.wait ?? 1200);
        const id = `j-${j.id}-${String(++n).padStart(2, "0")}`;
        const tree = await p.evaluate(`(${extract})(${JSON.stringify(VIEW[st.lane])})`);
        iconsToSvg(tree);
        writeFileSync(out + id + ".json", JSON.stringify({ id, app: st.lane, ...tree }));
        // The same moment also documents a spec screen that has no recipe of its own.
        if (st.as) writeFileSync(out + st.as + ".json", JSON.stringify({ id: st.as, app: st.lane, ...tree }));
        if (shots) await p.screenshot({ path: `${shots}/${id}.png` });
        steps.push({ lane: st.lane, label: typeof st.label === "function" ? st.label(ctx) : st.label, screen: id });
      } else {
        if (st.act) await st.act(null, ctx);
        steps.push({ lane: "system", label: st.label, api: st.api });
      }
      console.log("  ✓", j.id, steps.length, steps.at(-1).label);
    } catch (e) {
      console.log("  ✗", j.id, "step", steps.length + 1, `"${st.label}"`, String(e.message || e).split("\n")[0]);
      break;
    }
  }
  for (const p of Object.values(pages)) await p.context().close();
  if (j.teardown) await j.teardown(ctx);
  return {
    id: "j-" + j.id,
    ...(j.entry ? { entry: j.entry } : {}),
    title: j.title,
    summary: j.summary,
    big: true,
    steps: steps.map((s, i) => ({ ...s, col: i })),
    edges: steps.slice(1).map((_, i) => [i, i + 1, ""]),
  };
}

// ---------------------------------------------------------------- journeys
const click = (text, opts = {}) => async (p) => p.getByText(text, { exact: opts.exact ?? false }).nth(opts.nth ?? 0).click();
const tab = (name) => click(name, { exact: true });
const fillNth = (i, value) => async (p) => p.locator("input:visible").nth(i).fill(value);
const seq = (...fns) => async (p, ctx) => {
  for (const f of fns) {
    await f(p, ctx);
    await p.waitForTimeout(600);
  }
};
const lastButton = (text) => async (p) => p.getByText(text, { exact: true }).last().click();
// Admin form helpers: shadcn selects are labelled comboboxes; reasons are textareas.
const choose = (label, option) => async (p) => {
  await p.getByLabel(label, { exact: true }).last().click();
  await p.waitForTimeout(400);
  await p.getByRole("option", { name: option }).first().click();
};
const reason = (text) => async (p) => p.locator("[role=dialog] textarea:visible").last().fill(text);
const press = (name) => async (p) => p.getByRole("button", { name, exact: typeof name === "string" }).last().click();
const admin = (path) => async (p) => p.goto(URLS.admin + path);
const search = (text) => async (p) => p.getByLabel("Search table").first().fill(text);
const staffApi = async () => login("irene@loadmaster.test", "staff");
const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

// ---------------------------------------------- Home entry-point journeys
// One journey per entry point on the customer Home screen (`entry` orders them
// in Figma). Each step label says what the screen shows, then what to do next.
const ALEX = "demo-customer-1";
const BRIAN = "demo-driver-1";
const isOpen = (o) => !["delivered", "cancelled", "completed"].includes(o.stage);
// The demo allows one active order per customer: start every ordering journey clean.
const clearOrders = async () => {
  await api("/availability", BRIAN, { online: true }).catch(() => undefined);
  for (const o of (await api("/snapshot", ALEX)).orders || []) if (isOpen(o)) await api(`/orders/${o.id}/cancel`, ALEX, { reason: "Changed my plans" }).catch(() => undefined);
};
const latestOrder = async () => [...((await api("/snapshot", ALEX)).orders || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
// Pass an automatic-matching request along until it reaches Brian, the driver app's demo account.
const steerToBrian = async (ctx) => {
  const staff = await staffApi();
  ctx.vars.trip = (await latestOrder()).id;
  for (let i = 0; i < 12; i++) {
    const offered = (await api("/admin", staff)).orders.find((x) => x.id === ctx.vars.trip)?.dispatch?.find((e) => e.status === "offered")?.driverId;
    if (offered === "driver-1") return;
    if (!offered) await new Promise((r) => setTimeout(r, 1000));
    else await api(`/orders/${ctx.vars.trip}/decline`, "demo-" + offered, { reason: "Too far from me" }).catch(() => undefined);
  }
};
// A delivered trip of Alex's without a reward of this kind (rewards must cite one).
const rewardTrip = async (kind) => {
  const d = await api("/admin", await staffApi());
  const used = new Set(d.rewards.filter((r) => r.account === "customer-1" && r.kind === kind).map((r) => r.orderId));
  const found = d.orders.find((o) => o.customerId === "customer-1" && o.stage === "delivered" && !used.has(o.id));
  if (found) return found.id;
  await clearOrders();
  const q = await api("/quotes", ALEX, { pickupId: "ntinda", destinationId: "kololo", truckId: "small" });
  const o = await api("/orders", ALEX, { quoteId: q.id, method: "mtn" });
  await steerToBrian({ vars: {} });
  await api(`/orders/${o.id}/accept`, BRIAN, {});
  for (const stage of ["to_pickup", "at_pickup", "loading", "in_transit", "at_destination", "offloading", "delivered"])
    await api(`/orders/${o.id}/advance`, BRIAN, { stage, ...(stage === "delivered" ? { confirmed: true } : {}) });
  return o.id;
};
const home = async (p) => { await p.goto(URLS.customer); await p.waitForTimeout(3500); };
const byLabel = (label) => async (p) => p.getByLabel(label).first().click();
const next = (text) => async (p) => p.getByText(text, { exact: true }).last().click();
const W = { wait: 2500 };
// The four wizard steps every customer order goes through.
const wizard = (notes) => [
  { lane: "customer", ...W, act: next("Continue"), label: notes.truck },
  { lane: "customer", ...W, act: next("Cargo & contacts"), label: notes.cargo || "Step 2 of 4 · Cargo & contacts: sender (you by default or someone else), cargo items with weight against the truck payload, the recipient at each stop and an optional handover PIN. Next: Payment & pairing." },
  { lane: "customer", ...W, act: next("Payment & pairing"), label: notes.pay || "Step 3 of 4 · Payment & pairing: who pays (you, or the recipient after handover), the payment method and optional pairing with a known driver. Next: Review order." },
  { lane: "customer", ...W, act: next("Review order"), label: notes.review || "Step 4 of 4 · Review your order: route, contacts, cargo, the fee breakdown, payer, method and matching. Tick the acknowledgement to enable Order a truck." },
  { lane: "customer", act: byLabel("Accept cargo service acknowledgement"), label: "The acknowledgement is ticked; the total and Order a truck are ready at the bottom." },
  { lane: "customer", wait: 3500, act: next("Order a truck"), label: notes.placed },
];
const loginAs = (url) => async (p) => { await p.goto(url); await p.waitForTimeout(3500); };
const reviewOffer = { lane: "driver", wait: 2500, act: async (p) => { await loginAs(URLS.driver)(p); await click("Review request")(p); } };
const acceptOffer = { lane: "driver", wait: 1500, act: click("Accept this order") };
const customerSeesDriver = { lane: "customer", wait: 3500, act: async (p, c) => { await home(p); await tab("Orders")(p); await p.waitForTimeout(1200); await p.getByText(c.vars.trip).first().click(); } };
const newReward = (kind, amount, why) =>
  seq(press(/New reward/), choose("Recipient", /^Alex Mukasa$/), choose("Reward type", kind), async (p, c) => { await p.getByLabel("Completed trip", { exact: true }).last().click(); await p.waitForTimeout(300); await p.getByRole("option", { name: c.vars.trip }).click(); }, async (p) => p.getByLabel(/Amount/).last().fill(amount), reason(why));
const payReward = seq(async (p) => p.getByRole("button", { name: "Pay reward" }).first().click(), async (p) => { const t = p.locator("[role=dialog] textarea:visible"); if (await t.count()) await t.last().fill("Approved by finance."); });
const rewardsPage = async (p) => { await home(p); await tab("Account")(p); await p.waitForTimeout(800); await click("More account options")(p); await p.waitForTimeout(600); await click("Referrals & rewards")(p); };
// Reward records are listed oldest first: bring the one this journey created into view.
const showReward = (why) => async (p) => { await rewardsPage(p); await p.waitForTimeout(1500); await p.getByText(why).last().scrollIntoViewIfNeeded(); };
const LOYAL = "Thank you for being a loyal customer.";
const REFERRED = "Referred a friend whose first delivery is complete.";

const JOURNEYS = [
  {
    id: "home-order",
    entry: 1,
    title: "Home entry 1 · Order a cargo truck",
    summary: "Entry point: the green Order a cargo truck button on Home. Alex sets pickup and destination, picks a truck, adds cargo and contacts, chooses how to pay, reviews and places the order. LoadMaster offers it to eligible online drivers; Brian accepts in the driver app and Alex sees the assigned driver.",
    setup: clearOrders,
    teardown: clearOrders,
    steps: [
      { lane: "customer", label: "Home · entry point. The green Order a cargo truck button (“Set pickup and destination”) starts an immediate order. Next: tap it." },
      { lane: "customer", ...W, act: click("Order a cargo truck"), label: "Locations: map with the pickup pin, “Where is the cargo?” and “Where is it going?” prefilled from saved places, plus recent destinations. Next: Continue." },
      ...wizard({
        truck: "Step 1 of 4 · Truck & destinations: the route, truck sizes (Pickup, Medium, Large), loading helpers at pickup, delivery stops (up to 5) and the estimated total. Next: choose a truck.",
        placed: "Order placed: confirmation with the order number; LoadMaster is finding a driver. Next: Track my order.",
      }).flatMap((st, i) => (i === 0 ? [st, { lane: "customer", act: click("Medium truck"), label: "Medium truck selected (up to 3 tonnes, covered): the estimated total updates. Next: Cargo & contacts." }] : [st])),
      { lane: "system", label: "POST /orders · order created as Finding a driver and offered to eligible online drivers, one at a time, each with a response countdown", api: "POST /orders", act: async (_, ctx) => steerToBrian(ctx) },
      { lane: "customer", wait: 2500, act: next("Track my order"), label: "Order screen · Finding a driver: route map, stops, cargo, delivery progress, payment and Cancel order while the cargo is not collected." },
      { ...reviewOffer, label: "Driver app · Brian taps Review request: pickup, stops, cargo, truck, his earning and the response countdown." },
      { ...acceptOffer, label: "Driver app · Accept this order: the trip is Brian's and moves to his Deliveries." },
      { ...customerSeesDriver, label: "Customer app · the order now shows Brian as the driver, his truck and the handover codes." },
      { lane: "customer", wait: 2000, act: click("Messages & quick replies"), as: "c-chat", label: "Messages & quick replies: chat with the assigned driver about this order, with one-tap quick replies." },
    ],
  },
  {
    id: "home-schedule",
    entry: 2,
    title: "Home entry 2 · Schedule pickup",
    summary: "Entry point: the Schedule pickup tile on Home. Same order wizard as Order a cargo truck, with a pickup date and time chosen up front. The order is saved as scheduled and dispatched to drivers closer to the pickup time.",
    setup: clearOrders,
    teardown: clearOrders,
    steps: [
      { lane: "customer", label: "Home · entry point. The Schedule pickup tile (first of the three shortcuts) books a truck for later. Next: tap it." },
      { lane: "customer", ...W, act: byLabel("Schedule pickup"), label: "Locations · “Schedule your pickup.”: pickup and destination plus Pickup date & time, with Change date and Change time. Next: Continue." },
      ...wizard({
        truck: "Step 1 of 4 · Truck & destinations for the scheduled trip: route, truck size, helpers, stops and estimate. Next: Cargo & contacts.",
        placed: "Pickup scheduled: the order number is booked and LoadMaster starts finding a driver before pickup. Next: Track my order.",
      }),
      { lane: "system", label: "POST /orders (scheduledAt) · order saved as Scheduled; dispatch to drivers starts near the pickup time", api: "POST /orders" },
      { lane: "customer", wait: 3000, act: async (p) => { const t = p.getByText(/Track my order|View order/).last(); if (await t.count()) await t.click(); else { await home(p); await tab("Orders")(p); } }, label: "Order screen · Scheduled: the scheduled pickup date and time; eligible drivers receive the request when it is due." },
      { lane: "customer", wait: 2500, act: async (p) => { await home(p); await tab("Orders")(p); }, label: "Orders tab lists the trip as Scheduled." },
    ],
  },
  {
    id: "home-repeat",
    entry: 3,
    title: "Home entry 3 · Order again",
    summary: "Entry point: the Order again tile on Home. Alex picks a past trip; its route, cargo and contacts are copied into the order wizard to review and edit, and a fresh price is calculated before ordering.",
    setup: clearOrders,
    teardown: clearOrders,
    steps: [
      { lane: "customer", label: "Home · entry point. The Order again tile (middle shortcut) repeats a past trip. Next: tap it." },
      { lane: "customer", ...W, act: byLabel("Order again"), label: "Order again: completed, returned and cancelled trips, newest first, each with route, date, status and price. Next: choose a trip." },
      { lane: "customer", ...W, act: async (p) => p.getByLabel(/Repeat trip/).filter({ hasText: "Delivered" }).first().click(), label: "A delivered trip is chosen: Locations opens prefilled with its pickup and destination. Next: Continue." },
      ...wizard({
        truck: "Step 1 of 4 · the past trip's truck, loading helpers and stops are preselected; a fresh estimate is shown. Next: Cargo & contacts.",
        cargo: "Step 2 of 4 · cargo items, sender and recipients copied from the past trip, ready to edit. Next: Payment & pairing.",
        pay: "Step 3 of 4 · the past trip's payment method is preselected. Next: Review order.",
        placed: "Order placed: confirmation with the new order number. Next: Track my order.",
      }),
      { lane: "system", label: "POST /orders · a new order with a fresh quote; the past trip is unchanged", api: "POST /orders" },
      { lane: "customer", wait: 2500, act: next("Track my order"), label: "Order screen · Finding a driver for the repeated trip." },
    ],
  },
  {
    id: "home-driver-id",
    entry: 4,
    title: "Home entry 4 · Use a driver ID",
    summary: "Entry point: the Use a driver ID tile on Home. Alex enters a driver's short number (Brian is 2001). LoadMaster checks the driver is verified, online, free and has a big enough truck, then the order goes to that driver first; Brian accepts and is assigned.",
    setup: clearOrders,
    teardown: clearOrders,
    steps: [
      { lane: "customer", label: "Home · entry point. The Use a driver ID tile (third shortcut) sends an order straight to a driver you know. Next: tap it." },
      { lane: "customer", ...W, act: byLabel(/Use a driver ID|Match a driver/), label: "Use a driver ID: Driver number or ID field; the order goes to this driver for acceptance. Next: enter the number." },
      { lane: "customer", wait: 2000, act: seq(fillNth(0, "9999"), click("Check driver & continue")), label: "Unknown number: “Check the driver's short number.” Nothing is sent until a valid driver is found." },
      { lane: "system", label: "POST /account/pair · resolves the short number; refuses drivers who are offline, busy, unverified or whose truck is too small (8 attempts a minute)", api: "POST /account/pair" },
      { lane: "customer", ...W, act: seq(fillNth(0, "2001"), click("Check driver & continue")), label: "Brian (2001) is available: Locations opens with his truck size carried over. Next: Continue." },
      ...wizard({
        truck: "Step 1 of 4 · Truck & destinations, preset to Brian's truck size. Next: Cargo & contacts.",
        pay: "Step 3 of 4 · Your matched driver: Brian Kato with his truck and plate, awaiting his consent after ordering. Use automatic matching switches back. Next: Review order.",
        review: "Step 4 of 4 · Review your order shows “Pair with Brian Kato” as matching. Tick the acknowledgement.",
        placed: "Order placed. Next: Track my order.",
      }),
      { lane: "customer", wait: 2500, act: async (p, c) => { c.vars.trip = (await latestOrder()).id; await next("Track my order")(p); }, label: "Order screen · Awaiting your paired driver: only Brian is asked; Search other eligible drivers falls back to automatic matching." },
      { ...reviewOffer, label: "Driver app · Brian's request is marked as paired to him. Review request shows the trip and countdown." },
      { ...acceptOffer, label: "Driver app · Accept this order." },
      { ...customerSeesDriver, label: "Customer app · Brian is the assigned driver." },
    ],
  },
  {
    id: "topup",
    entry: 5,
    title: "Home entry 5 · Add funds",
    summary: "Entry point: Add funds on the Home wallet card. Alex adds UGX 75,000 to the LoadMaster wallet with Airtel Money. The demo approves instantly; the balance on Home updates and operations sees the top-up in the money ledger.",
    steps: [
      { lane: "customer", label: "Home · entry point. The wallet card shows the balance (the eye hides it) and Add funds. Next: tap Add funds." },
      { lane: "customer", label: "Add funds sheet: wallet balance, amount, payment method (MTN, Airtel, demo card) and the demo outcome (Success, Pending, Failed). Next: enter an amount.", act: click("Add funds") },
      { lane: "customer", label: "UGX 75,000 entered and Airtel Money chosen. Next: Approve demo top-up.", act: seq(fillNth(0, "75000"), click("Airtel Money")) },
      { lane: "customer", label: "Top-up approved: success confirmation with the new balance.", act: click("Approve demo top-up"), wait: 900, as: "c-done-wallet" },
      { lane: "system", label: "POST /account/wallet · wallet_topup posted to the ledger (customer wallet ← Airtel Money)", api: "POST /account/wallet" },
      { lane: "customer", label: "Close the sheet: Home shows the new balance.", act: async (p) => { await p.waitForTimeout(2500); await p.keyboard.press("Escape"); const x = p.getByLabel(/close/i); if (await x.count()) await x.first().click().catch(() => undefined); }, wait: 2500 },
      { lane: "admin", label: "Admin · Transfers ledger lists the wallet top-up.", act: async (p) => p.goto(URLS.admin + "/transfers"), wait: 3000 },
      { lane: "admin", label: "Admin · Collections and reconciliation stay balanced.", act: async (p) => p.goto(URLS.admin + "/reconciliation"), wait: 3000 },
    ],
  },
  {
    id: "home-loyalty",
    entry: 6,
    title: "Home entry 6 · Loyalty rewards",
    summary: "Entry point: the Loyalty & referral rewards banner on Home. Alex reads how loyalty rewards work. Finance then gives Alex a cashback for a completed trip; it is paid into the LoadMaster wallet, listed under Referrals & rewards and can be spent by choosing LoadMaster wallet at payment.",
    setup: async (ctx) => { ctx.vars.trip = await rewardTrip("cashback"); },
    steps: [
      { lane: "customer", label: "Home · entry point. The Loyalty & referral rewards banner at the bottom of Home. Next: tap it." },
      { lane: "customer", wait: 1200, act: byLabel("View loyalty rewards offer"), label: "Offer card · “More value with LoadMaster”: approved referral and cashback rewards are credited to the LoadMaster wallet and used by choosing LoadMaster wallet at payment. Next: Got it." },
      { lane: "customer", act: click("Got it"), label: "Back on Home." },
      { lane: "admin", wait: 3000, act: admin("/rewards"), label: "Admin · Referrals & cashbacks: every reward with status." },
      { lane: "admin", act: newReward("Customer cashback", "5000", LOYAL), label: "Admin · New reward: Alex, Customer cashback, the completed trip, UGX 5,000 and a reason." },
      { lane: "admin", wait: 2500, act: press(/Save changes|Create/), label: "Admin · Saved: the cashback is pending." },
      { lane: "admin", act: payReward, label: "Admin · Pay reward: confirm with a note." },
      { lane: "admin", wait: 2500, act: press(/Save changes|Pay/), label: "Admin · Paid: the cashback is credited to Alex's wallet." },
      { lane: "system", label: "POST /admin/reward · reward posted to the ledger (customer wallet ← platform)", api: "POST /admin/reward" },
      { lane: "customer", wait: 2000, act: showReward(LOYAL), label: "Customer · Account › Referrals & rewards lists the new Customer cashback as paid, with its reason." },
      { lane: "customer", wait: 2500, act: home, label: "Customer · Home: the wallet balance includes the cashback." },
      { lane: "customer", wait: 2000, act: seq(click("Order a cargo truck"), async (p) => p.waitForTimeout(2000), next("Continue"), async (p) => p.waitForTimeout(2000), next("Cargo & contacts"), async (p) => p.waitForTimeout(1500), next("Payment & pairing"), async (p) => p.waitForTimeout(1500), click("LoadMaster wallet")), label: "Using it: at Step 3 · Payment, choose LoadMaster wallet to pay from the balance." },
    ],
  },
  {
    id: "home-referral",
    entry: 7,
    title: "Home entry 7 · Referral",
    summary: "Entry point: the Loyalty & referral rewards banner, then Account › Referrals & rewards. Alex shares a personal referral code. When the referred friend completes a trip, operations records a referral bonus and pays it into Alex's LoadMaster wallet.",
    setup: async (ctx) => { ctx.vars.trip = await rewardTrip("referral"); },
    steps: [
      { lane: "customer", label: "Home · entry point. Loyalty & referral rewards banner; referrals are managed from Account. Next: Account tab." },
      { lane: "customer", wait: 1200, act: seq(tab("Account"), click("More account options")), label: "Account › More account options lists Referrals & rewards. Next: tap it." },
      { lane: "customer", wait: 2000, act: click("Referrals & rewards"), label: "Referrals & rewards · “A good move is worth sharing.”: Alex's referral code, Preview loyalty offer card, Share referral code and past reward records." },
      { lane: "system", label: "Share referral code opens the phone's share sheet with “My LoadMaster demo referral code is LM-…”. The friend signs up and completes a trip." },
      { lane: "admin", wait: 3000, act: admin("/rewards"), label: "Admin · Referrals & cashbacks." },
      { lane: "admin", act: newReward("Referral bonus", "10000", REFERRED), label: "Admin · New reward: Alex, Referral bonus, the qualifying completed trip, UGX 10,000 and a reason." },
      { lane: "admin", wait: 2500, act: press(/Save changes|Create/), label: "Admin · Saved: the referral bonus is pending." },
      { lane: "customer", wait: 2000, act: showReward(REFERRED), label: "Customer · Referrals & rewards: the referral bonus shows as pending." },
      { lane: "admin", act: payReward, label: "Admin · Pay reward: confirm with a note." },
      { lane: "admin", wait: 2500, act: press(/Save changes|Pay/), label: "Admin · Paid into Alex's wallet." },
      { lane: "customer", wait: 2000, act: showReward(REFERRED), label: "Customer · Referrals & rewards: the referral bonus is paid." },
      { lane: "customer", wait: 2500, act: home, label: "Customer · Home: the wallet balance includes the bonus." },
    ],
  },
  {
    id: "payout",
    // The app allows one open request: clear Brian's leftovers from earlier runs.
    setup: async () => {
      const staff = await login("irene@loadmaster.test", "staff");
      for (const w of (await api("/admin", staff)).withdrawals || [])
        if (w.driverId === "driver-1" && ["requested", "approved", "failed"].includes(w.status))
          await api("/admin/withdrawal", staff, { id: w.id, status: "rejected", reason: "Superseded demo request" }).catch(() => undefined);
    },
    title: "Driver is paid out",
    summary: "Brian withdraws UGX 150,000 of unpaid earnings to Airtel Money. Operations reviews the request and approves it for finance payment; Brian sees the request move on in the app.",
    steps: [
      { lane: "driver", label: "Earnings shows scheduled (unpaid) earnings.", act: tab("Earnings") },
      { lane: "driver", label: "Open payout requests: choose an amount and a payout platform.", act: click("Request or view scheduled payout") },
      { lane: "driver", label: "Enter UGX 150,000 and pick Airtel Money.", act: seq(fillNth(0, "150000"), click("Airtel Money")) },
      { lane: "driver", label: "Request withdrawal: confirmation.", act: click("Request withdrawal"), wait: 900, as: "d-done-payout" },
      { lane: "system", label: "POST /account/withdrawal · earnings moved to withdrawal clearing; request pending review", api: "POST /account/withdrawal" },
      { lane: "driver", label: "The request is listed under Your requests as pending.", wait: 3500 },
      { lane: "admin", label: "Driver payouts lists the new request.", act: async (p) => p.goto(URLS.admin + "/payouts"), wait: 3000 },
      { lane: "admin", label: "Review request: Approve for finance payment, with a reason for the audit trail.", act: async (p) => { await p.getByRole("button", { name: "Review request" }).first().click(); await p.waitForTimeout(800); await p.locator("textarea:visible").first().fill("Earnings match completed trips."); } },
      { lane: "admin", label: "Save: the payout is approved for finance payment.", act: async (p) => p.getByRole("button", { name: "Save changes" }).last().click(), wait: 2500 },
      { lane: "driver", label: "Brian's payout request shows the new status.", act: async (p) => { await p.goto(URLS.driver); await p.waitForTimeout(3000); await tab("Earnings")(p); await click("Request or view scheduled payout")(p); }, wait: 2500 },
    ],
  },
  {
    id: "driver-onboarding",
    title: "New driver registers and gets verified",
    summary: "Grace creates a driver account, confirms the demo code, adds her truck and submits the four required documents. Operations approves each document and then the driver, after which Grace can go online.",
    steps: [
      { lane: "driver", signedOut: true, label: "Driver app sign-in. Tap Create account." },
      { lane: "driver", label: "Registration form.", act: click("Create account") },
      {
        lane: "driver",
        label: "Fill name, phone, email and password.",
        act: async (p, ctx) => {
          const t = String(Date.now()).slice(-6);
          ctx.vars.email = `grace.${t}@example.test`;
          for (const [i, v] of ["Grace Namubiru", "+256 701 " + t, ctx.vars.email, PASSWORD].entries()) await fillNth(i, v)(p);
        },
      },
      { lane: "driver", label: "Create account: enter the demo verification code.", act: lastButton("Create account"), wait: 2500, as: "d-verify" },
      {
        lane: "driver",
        label: "Verify & continue: Home asks for verification before going online.",
        act: async (p) => {
          const code = (await p.getByText(/DEMO CODE/).first().innerText()).match(/\d{4,}/)[0];
          await fillNth(0, code)(p);
          await click("Verify & continue")(p);
        },
        wait: 4000,
        as: "d-home-unverified",
      },
      { lane: "driver", label: "Account › Vehicle & verification: nothing submitted yet.", act: seq(tab("Account"), click("Vehicle & verification")), wait: 2000 },
      { lane: "driver", label: "Edit vehicle details: model and licence plate.", act: seq(click("Edit vehicle details"), async (p) => { const inputs = p.locator("input:visible"); await inputs.nth(0).fill("Isuzu Elf"); await inputs.nth(1).fill("UBN 418 Q"); }) },
      { lane: "driver", label: "Submit vehicle for review.", act: click("Submit vehicle for review"), wait: 2000 },
      {
        lane: "system",
        label: "POST /account/document ×4 · Driver licence, Identity document, Vehicle registration, Third-party insurance (photos picked on the phone)",
        api: "POST /account/document",
        act: async (_, ctx) => {
          const token = await login(ctx.vars.email, "driver");
          for (const name of ["Driver licence", "Identity document", "Vehicle registration", "Third-party insurance"])
            await api("/account/document", token, { name, fileName: name.toLowerCase().replace(/ /g, "-") + ".png", content: PIXEL });
        },
      },
      { lane: "driver", label: "All four documents submitted: awaiting review.", act: async (p) => { await p.goto(URLS.driver); await p.waitForTimeout(3000); await tab("Account")(p); await click("Vehicle & verification")(p); }, wait: 2000 },
      { lane: "admin", label: "Drivers list: Grace is awaiting review.", act: async (p) => p.goto(URLS.admin + "/drivers"), wait: 3000 },
      { lane: "admin", label: "Driver page: vehicle and documents to review.", act: async (p, ctx) => { await p.getByLabel("Search table").fill(ctx.vars.email); await p.waitForTimeout(1200); await p.getByText("Grace Namubiru").first().click(); }, wait: 3000 },
      {
        lane: "admin",
        label: "Documents tab › Review the driver licence: Approve, with a note.",
        act: async (p) => {
          const docs = p.getByRole("tab", { name: "Documents" });
          if (!(await docs.isVisible().catch(() => false))) await p.getByText("More", { exact: true }).first().click();
          await p.getByRole("tab", { name: "Documents" }).or(p.getByRole("menuitem", { name: "Documents" })).first().click();
          await p.waitForTimeout(1200);
          await p.getByRole("button", { name: "Review", exact: true }).first().click();
          await p.waitForTimeout(800);
          await p.locator("textarea:visible").first().fill("Clear, valid and matches the driver.");
        },
      },
      {
        lane: "admin",
        label: "Save, then approve the other three documents the same way.",
        act: async (p) => {
          await p.getByRole("button", { name: "Save changes" }).last().click();
          await p.waitForTimeout(1500);
          for (let i = 1; i < 4; i++) {
            await p.getByRole("button", { name: "Review", exact: true }).nth(i).click();
            await p.waitForTimeout(700);
            await p.locator("textarea:visible").first().fill("Clear, valid and matches the driver.");
            await p.getByRole("button", { name: "Save changes" }).last().click();
            await p.waitForTimeout(1500);
          }
        },
        wait: 1500,
      },
      {
        lane: "admin",
        label: "Approve driver & vehicle.",
        act: async (p) => {
          await p.getByRole("button", { name: /Approve driver/ }).first().click();
          await p.waitForTimeout(800);
          const reason = p.locator("textarea:visible");
          if (await reason.count()) await reason.first().fill("Documents and vehicle verified.");
        },
      },
      { lane: "admin", label: "Confirm: Grace is an approved driver.", act: async (p) => p.getByRole("button", { name: /Approve driver|Save changes|Confirm/ }).last().click(), wait: 2500 },
      { lane: "driver", label: "Vehicle & verification now shows Grace as approved.", act: async (p) => { await p.goto(URLS.driver); await p.waitForTimeout(4000); await tab("Account")(p); await click("Vehicle & verification")(p); }, wait: 2500 },
      { lane: "driver", label: "Home: verified, Grace can go online.", act: async (p) => { await p.goto(URLS.driver); await p.waitForTimeout(8000); }, wait: 1500 },
    ],
  },
  {
    id: "customer-signup",
    title: "New customer creates an account",
    summary: "A new customer registers in the customer app, confirms the demo code and lands on Home ready to order a truck.",
    steps: [
      { lane: "customer", signedOut: true, label: "Customer app sign-in. Tap Create account." },
      { lane: "customer", label: "Registration form.", act: click("Create account") },
      {
        lane: "customer",
        label: "Fill name, phone, email and password.",
        act: async (p) => {
          const t = String(Date.now()).slice(-6);
          for (const [i, v] of ["Sarah Achieng", "+256 702 " + t, `sarah.${t}@example.test`, PASSWORD].entries()) await fillNth(i, v)(p);
        },
      },
      { lane: "customer", label: "Create account: enter the demo verification code.", act: lastButton("Create account"), wait: 2500, as: "c-verify" },
      {
        lane: "customer",
        label: "Verify & continue: Home, ready to order.",
        act: async (p) => {
          const code = (await p.getByText(/DEMO CODE/).first().innerText()).match(/\d{4,}/)[0];
          await fillNth(0, code)(p);
          await click("Verify & continue")(p);
        },
        wait: 4000,
      },
    ],
  },
  {
    id: "trip-reassign",
    title: "Operations reassigns a trip to another driver",
    summary: "Brian has accepted Alex's trip but cannot make the pickup. Operations opens the trip, reassigns it to Grace with a reason, and both apps update: Brian's request is withdrawn and Alex sees the new driver.",
    setup: async (ctx) => {
      const staff = await staffApi();
      for (const d of ["demo-driver-1", "demo-driver-2"]) await api("/availability", d, { online: true }).catch(() => undefined);
      const snap = await api("/snapshot", "demo-customer-1");
      for (const o of snap.orders || []) if (!["delivered", "cancelled", "completed"].includes(o.stage)) await api(`/orders/${o.id}/cancel`, "demo-customer-1", { reason: "Changed my plans" }).catch(() => undefined);
      const q = await api("/quotes", "demo-customer-1", { pickupId: "ntinda", destinationId: "kololo", truckId: "small" });
      const o = await api("/orders", "demo-customer-1", { quoteId: q.id, method: "mtn" });
      ctx.vars.trip = o.id;
      for (let i = 0; i < 12; i++) {
        const a = (await api("/admin", staff)).orders.find((x) => x.id === o.id);
        const offered = a?.dispatch?.find((e) => e.status === "offered")?.driverId;
        if (!offered) await new Promise((r) => setTimeout(r, 1000));
        else if (offered === "driver-1") break;
        else await api(`/orders/${o.id}/decline`, "demo-" + offered, { reason: "Too far from me" }).catch(() => undefined);
      }
      await api(`/orders/${o.id}/accept`, "demo-driver-1", {});
    },
    steps: [
      { lane: "admin", label: (c) => `Trips: find ${c.vars.trip} (assigned to Brian).`, act: async (p, c) => { await admin("/trips")(p); await p.waitForTimeout(2500); await search(c.vars.trip)(p); }, wait: 1500 },
      { lane: "admin", label: "Open the trip page.", act: async (p, c) => p.goto(URLS.admin + "/trips/" + c.vars.trip), wait: 3000 },
      { lane: "admin", label: "Manage assignment: choose Grace and give a reason.", act: seq(press("Manage assignment"), choose("Verified online driver", /Grace Nambasa/), reason("Brian's truck has a flat tyre; Grace is closest.")) },
      { lane: "admin", label: "Save: Grace is the assigned driver.", act: press("Save changes"), wait: 2500 },
      { lane: "admin", label: "Driver requests: Brian's acceptance withdrawn, Grace assigned by operations.", act: async (p) => p.getByRole("tab", { name: /Driver requests/ }).first().click(), wait: 1500 },
      { lane: "driver", label: "Brian's Updates: the order was reassigned.", act: async (p) => p.getByLabel(/notification|update/i).first().click(), wait: 2000 },
      { lane: "customer", label: "Alex's order shows Grace as the driver.", act: async (p, c) => { await tab("Orders")(p); await p.waitForTimeout(1200); await p.getByText(c.vars.trip).first().click(); }, wait: 2500 },
    ],
  },
  {
    id: "account-suspension",
    title: "Operations suspends and reactivates a driver",
    summary: "A driver account is suspended with a reason (signed out everywhere, no requests), the action is recorded in the audit trail, and the account is reactivated later.",
    steps: [
      { lane: "admin", label: "Drivers: find Harriet.", act: async (p) => { await admin("/drivers")(p); await p.waitForTimeout(2500); await search("driver-104")(p); }, wait: 1500 },
      { lane: "admin", label: "Driver page.", act: admin("/drivers/driver-104"), wait: 3000 },
      { lane: "admin", label: "More actions menu.", act: press("More actions"), wait: 800 },
      { lane: "admin", label: "Suspend account: give a reason.", act: seq(async (p) => p.getByRole("menuitem", { name: /Suspend account/ }).click(), reason("Documents under investigation.")) },
      { lane: "admin", label: "Save: Harriet is suspended.", act: press("Save changes"), wait: 2500 },
      { lane: "admin", label: "Audit trail records who suspended her and why.", act: admin("/audit"), wait: 3000 },
      { lane: "admin", label: "Back on the driver page: More › Reactivate account.", act: seq(admin("/drivers/driver-104"), async (p) => p.waitForTimeout(2500), press("More actions"), async (p) => p.getByRole("menuitem", { name: /Reactivate account/ }).click(), async (p) => { const t = p.locator("[role=dialog] textarea:visible"); if (await t.count()) await t.last().fill("Investigation closed."); }) },
      { lane: "admin", label: "Save: Harriet is active again.", act: press("Save changes"), wait: 2500 },
    ],
  },
  {
    id: "support-case",
    title: "Customer raises a support case and operations resolves it",
    summary: "Alex reports a problem from the customer app. Customer care finds the case, replies and marks it resolved; Alex sees the reply in Your support cases.",
    steps: [
      { lane: "customer", label: "Account tab: Help & support.", act: seq(tab("Account"), click("Help & support")), wait: 1500 },
      { lane: "customer", label: "Contact demo support: describe the issue.", act: seq(click("Contact demo support"), async (p, c) => { c.vars.tag = "Receipt missing for my last trip " + String(Date.now()).slice(-5); await p.getByPlaceholder("Payment, loading, cargo, or something else…").fill(c.vars.tag); }) },
      { lane: "customer", label: "Send support request: the case is recorded.", act: click("Send support request"), wait: 2000 },
      { lane: "system", label: "POST /account/ticket · case created (open) and visible to operations", api: "POST /account/ticket" },
      { lane: "admin", label: "Support: the new open case.", act: async (p, c) => { await admin("/support")(p); await p.waitForTimeout(2500); await search(c.vars.tag)(p); }, wait: 1500 },
      { lane: "admin", label: "Reply / resolve: write the reply and set Resolved.", act: seq(press("Reply / resolve"), reason("We've emailed your receipt. Sorry for the trouble!"), choose("Status", "Resolved")) },
      { lane: "admin", label: "Save: the case is resolved.", act: press("Save changes"), wait: 2500 },
      { lane: "customer", label: "Your support cases: resolved, with the reply.", act: async (p) => { await p.goto(URLS.customer); await p.waitForTimeout(3000); await tab("Account")(p); await p.waitForTimeout(800); await click("More account options")(p); await p.waitForTimeout(600); await click("Your support cases")(p); }, wait: 2000 },
    ],
  },
  {
    id: "reconciliation",
    title: "Finance reconciles a provider settlement report",
    summary: "Finance imports the mobile-money provider's settlement report. LoadMaster compares every line with its own collections and lists matches, amount differences and unknown references for follow-up.",
    setup: async (ctx) => {
      const staff = await staffApi();
      const paid = (await api("/admin", staff)).orders.flatMap((o) => (o.payment?.attempts || []).filter((a) => a.status === "paid" && !["cash", "wallet"].includes(a.method)).map((a) => [a.id, a.amount ?? o.quote.total])).slice(0, 3);
      ctx.vars.csv = ["reference,amount,fee", `${paid[0][0]},${paid[0][1]},0`, `${paid[1][0]},${paid[1][1]},0`, `${paid[2][0]},${paid[2][1] + 1000},0`, "MTN-UNKNOWN-7781,45000,0"].join("\n");
    },
    steps: [
      { lane: "admin", label: "Reconciliation: earlier imports.", act: admin("/reconciliation"), wait: 3000 },
      { lane: "admin", label: "Import report: collections, paste the provider's CSV.", act: seq(press(/Import report/), async (p, c) => p.locator("[role=dialog] textarea:visible").last().fill(c.vars.csv)) },
      { lane: "admin", label: "Compare records: matches, an amount difference and an unknown reference.", act: press("Compare records"), wait: 3000 },
      { lane: "admin", label: "Open the import to see every line.", act: async (p) => p.locator("tbody tr").first().click(), wait: 2000 },
    ],
  },
  {
    id: "staff-invite",
    title: "Super Admin invites a staff member",
    summary: "Irene invites a new customer-care agent. The account is created with a temporary password that must be changed at first sign-in; the role decides which sections they see.",
    steps: [
      { lane: "admin", label: "Staff & roles.", act: admin("/staff"), wait: 3000 },
      { lane: "admin", label: "Invite staff: name, email, phone and role.", act: seq(press(/Invite staff/), async (p, c) => { const t = String(Date.now()).slice(-5); c.vars.email = `agent.${t}@loadmaster.test`; await p.getByLabel("Full name").fill("Ruth Nakato"); await p.getByLabel("Email").fill(c.vars.email); await p.getByLabel("Phone").fill("+256 703 " + t + "0"); }, choose("Role", "Customer Care")) },
      { lane: "admin", label: "Save: the temporary password is shown once.", act: press(/Save changes|Invite/), wait: 2500 },
      { lane: "admin", label: "Ruth is listed with setup pending.", act: async (p) => { await p.keyboard.press("Escape"); await admin("/staff")(p); }, wait: 3000 },
    ],
  },
  {
    id: "pricing",
    title: "Operations changes the driver response window",
    summary: "Settings › Edit pricing rules: the response window goes from 45 to 60 seconds with a reason; new requests to drivers use the new countdown.",
    setup: async (ctx) => { ctx.vars.settings = (await api("/admin", await staffApi())).settings; },
    teardown: async (ctx) => { const s = ctx.vars.settings; await api("/admin/settings", await staffApi(), { feeRate: s.feeRate, helperRate: s.helperRate, offerSeconds: s.offerSeconds ?? 45, reason: "Restore demo defaults" }).catch(() => undefined); },
    steps: [
      { lane: "admin", label: "Settings: pricing and dispatch rules.", act: admin("/settings"), wait: 3000 },
      { lane: "admin", label: "Edit pricing rules: response window 60 seconds, with a reason.", act: seq(press("Edit pricing rules"), async (p) => p.locator("[role=dialog] input[type=number]").nth(2).fill("60"), async (p) => { const t = p.locator("[role=dialog] textarea:visible"); if (await t.count()) await t.last().fill("Drivers asked for more time on busy roads."); }) },
      { lane: "admin", label: "Save: the new window applies to new requests.", act: press(/Save changes/), wait: 2500 },
      { lane: "admin", label: "The audit trail records the change.", act: admin("/audit"), wait: 3000 },
    ],
  },
];

const only = process.argv[2] ? new Set(process.argv[2].split(",")) : null;
const manifestPath = out + "journeys.json";
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
for (const j of JOURNEYS) {
  if (only && !only.has(j.id)) continue;
  console.log("▶", j.title);
  const result = await run(j);
  // A journey that stopped early keeps its last complete version in Figma.
  if (result.steps.length === j.steps.length || !manifest["j-" + j.id]) manifest["j-" + j.id] = result;
  else {
    process.exitCode = 0;
    console.log(`  ! ${j.title}: stopped at step ${result.steps.length + 1}; keeping the previous complete journey.`);
  }
}
if (!only) for (const k of Object.keys(manifest)) if (!JOURNEYS.some((j) => "j-" + j.id === k)) delete manifest[k];
writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
await browser.close();
