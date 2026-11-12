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
  if (j.setup) await j.setup();
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
  return {
    id: "j-" + j.id,
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
const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const JOURNEYS = [
  {
    id: "topup",
    title: "Customer tops up the wallet",
    summary: "Alex adds UGX 75,000 to the LoadMaster wallet with Airtel Money. The demo approves instantly; the balance on Home updates and operations sees the top-up in the money ledger.",
    steps: [
      { lane: "customer", label: "Home shows the wallet balance. Tap Add funds." },
      { lane: "customer", label: "The Add funds sheet opens with the current balance.", act: click("Add funds") },
      { lane: "customer", label: "Enter the amount and choose Airtel Money.", act: seq(fillNth(0, "75000"), click("Airtel Money")) },
      { lane: "customer", label: "Approve the demo top-up: success confirmation.", act: click("Approve demo top-up"), wait: 900 },
      { lane: "system", label: "POST /account/wallet · wallet_topup posted to the ledger (customer wallet ← Airtel Money)", api: "POST /account/wallet" },
      { lane: "customer", label: "Close the sheet: Home shows the new balance.", act: async (p) => { await p.waitForTimeout(2500); await p.keyboard.press("Escape"); const x = p.getByLabel(/close/i); if (await x.count()) await x.first().click().catch(() => undefined); }, wait: 2500 },
      { lane: "admin", label: "Transfers ledger lists the wallet top-up.", act: async (p) => p.goto(URLS.admin + "/transfers") , wait: 3000 },
      { lane: "admin", label: "Collections and reconciliation stay balanced.", act: async (p) => p.goto(URLS.admin + "/reconciliation"), wait: 3000 },
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
      { lane: "driver", label: "Request withdrawal: confirmation.", act: click("Request withdrawal"), wait: 900 },
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
      { lane: "driver", label: "Create account: enter the demo verification code.", act: lastButton("Create account"), wait: 2500 },
      {
        lane: "driver",
        label: "Verify & continue: Home asks for verification before going online.",
        act: async (p) => {
          const code = (await p.getByText(/DEMO CODE/).first().innerText()).match(/\d{4,}/)[0];
          await fillNth(0, code)(p);
          await click("Verify & continue")(p);
        },
        wait: 4000,
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
      { lane: "customer", label: "Create account: enter the demo verification code.", act: lastButton("Create account"), wait: 2500 },
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
writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
await browser.close();
