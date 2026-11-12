import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";
import { CargoStore } from "../services/demo/cargo.mjs";
import { createServer } from "../services/demo/server.mjs";

// Fixtures create completed cargo handovers through the HTTP API. Customer
// approval/retry, driver withdrawal and office/finance actions use real screens.
const out = process.argv[2] || "/tmp/loadmaster-payment-review";
mkdirSync(out, { recursive: true });
const store = new CargoStore();
const server = createServer(store);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const call = async (path, actor, body) => {
  const response = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer demo-" + actor,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(`${path}: ${data.error?.code} ${data.error?.message}`);
  return data;
};
let sequence = 0;
async function delivery(method) {
  await call("/availability", "driver-1", { online: true });
  const quote = await call("/quotes", "customer-1", {
    pickupId: "ntinda",
    destinationId: "nakawa",
    truckId: "small",
    loading: 0,
    stops: [{ id: "stop-1", placeId: "nakawa", helpers: 0 }],
  });
  const response = await fetch(base + "/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer demo-customer-1",
      "Idempotency-Key": "payment-review-order-" + ++sequence,
    },
    body: JSON.stringify({
      quoteId: quote.id,
      method,
      cargoPlan: {
        sender: { name: "Alex Review", phone: "+256700000111" },
        items: [
          {
            description: "Furniture boxes",
            quantity: 1,
            weightKg: 10,
            stopId: "stop-1",
          },
        ],
        stops: [
          {
            id: "stop-1",
            recipient: { name: "Review Recipient", phone: "+256700000333" },
            pinRequired: false,
          },
        ],
        payer: "customer",
        termsAccepted: true,
      },
    }),
  });
  const order = await response.json();
  assert.equal(response.ok, true, JSON.stringify(order));
  await call(`/orders/${order.id}/accept`, "driver-1", {});
  for (const stage of [
    "to_pickup",
    "at_pickup",
    "loading",
    "in_transit",
    "at_destination",
    "offloading",
    "delivered",
  ])
    await call(`/orders/${order.id}/advance`, "driver-1", {
      stage,
      confirmed: true,
      stopId: "stop-1",
    });
  return order.id;
}
const errors = [];
const consoleErrors = [];
const networkErrors = [];
function watchConsole(page, role) {
  page.on("response", (response) => {
    if (response.url().startsWith(base) && response.status() >= 400)
      networkErrors.push({
        role,
        url: response.url(),
        status: response.status(),
      });
  });
  page.on("console", (message) => {
    if (message.type() === "error")
      consoleErrors.push(role + ": " + message.text());
  });
}
const checks = [];
let browser;
let customer;
let driver;
let admin;
const passed = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
async function mobile(role, port) {
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
  });
  await context.addInitScript(
    ({ role, base }) => {
      localStorage.setItem(
        "loadmaster-" + role,
        JSON.stringify({ account: role + "-1", url: base }),
      );
      localStorage.setItem("session-" + role, "demo-" + role + "-1");
    },
    { role, base },
  );
  const page = await context.newPage();
  watchConsole(page, role);
  page.on("pageerror", (error) => errors.push(role + ": " + error.message));
  await page.goto(`http://localhost:${port}`);
  return page;
}
async function dismissCelebration(page) {
  const button = page.getByRole("button", { name: "Continue", exact: true });
  await button.waitFor({ state: "visible", timeout: 1500 }).catch(() => {});
  if (await button.isVisible()) await button.click();
}
async function openPayment(id, awaitingApproval = true) {
  await customer.reload();
  await customer.getByRole("tab", { name: /Payments/ }).click();
  await customer.getByText(new RegExp(id)).first().click();
  if (awaitingApproval) {
    await expect(
      customer.getByRole("button", {
        name: "DEMO OUTCOME CONTROLS",
        exact: true,
      }),
    ).toBeVisible();
  }
}
async function importReport(kind, csv) {
  await admin.goto(base + "/operations/reconciliation");
  await admin
    .getByRole("button", { name: "Import report", exact: true })
    .click();
  if (kind !== "collections") {
    await admin
      .getByRole("combobox", { name: "Report type", exact: true })
      .click();
    await admin
      .getByRole("option", {
        name:
          kind === "payouts" ? "Outgoing driver payouts" : "Outgoing refunds",
        exact: true,
      })
      .click();
  }
  await admin.getByLabel("reference,amount,fee", { exact: true }).fill(csv);
  await admin
    .getByRole("button", { name: "Compare records", exact: true })
    .click();
  await expect(
    admin.getByRole("heading", { name: /^Reconciliation ·/ }),
  ).toBeVisible();
}
try {
  const id = await delivery("mtn");
  const walletBefore = store.state.accounts["customer-1"];
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROME_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  customer = await mobile(
    "customer",
    Number(process.env.CUSTOMER_PORT || 8091),
  );
  driver = await mobile("driver", Number(process.env.DRIVER_PORT || 8092));
  await openPayment(id);
  await customer
    .getByRole("button", { name: "DEMO OUTCOME CONTROLS", exact: true })
    .click();
  await customer
    .getByRole("radio", { name: "insufficient", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Approve demo payment", exact: true })
    .click();
  await expect(
    customer.getByRole("button", { name: "Retry payment", exact: true }),
  ).toBeVisible();
  assert.equal(store.order(id, "admin").payment.status, "failed");
  assert.equal(store.state.accounts["customer-1"], walletBefore);
  passed("failed mobile-money collection leaves wallet and ledger untouched");
  await customer
    .getByRole("button", { name: "Retry payment", exact: true })
    .click();
  await customer
    .getByRole("radio", { name: "Debited · confirmation delayed", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Approve demo payment", exact: true })
    .click();
  await expect(
    customer.getByRole("button", { name: "Check payment status", exact: true }),
  ).toBeVisible();
  const order = store.order(id, "admin");
  assert.equal(order.payment.status, "unknown");
  assert.equal(order.payment.attempts.length, 2);
  passed(
    "retry creates a linked attempt and delayed confirmation blocks further collection",
  );

  admin = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  watchConsole(admin, "admin");
  admin.on("pageerror", (error) => errors.push("admin: " + error.message));
  const session = await call("/auth/login", "admin", {
    role: "staff",
    identifier: "irene@loadmaster.test",
    password: "DemoCargo2026!",
  });
  await admin.goto(base + "/operations/");
  await admin.evaluate(
    (token) => localStorage.setItem("loadmaster-admin-token", token),
    session.token,
  );
  const collectionReference = order.payment.attempts.at(-1).id;
  await importReport(
    "collections",
    `reference,amount\n${collectionReference},${order.quote.total}`,
  );
  await admin
    .getByRole("button", { name: "Confirm existing payment", exact: true })
    .click();
  await admin
    .getByLabel("Reason (required)")
    .fill("Provider report confirms customer debit");
  await admin
    .getByRole("button", { name: "Confirm existing payment", exact: true })
    .click();
  await expect(
    customer.getByRole("button", { name: "Back to order", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  assert.equal(order.payment.status, "paid");
  assert.equal(
    store.state.ledger.filter(
      (l) => l.reference === id && l.kind === "collection",
    ).length,
    1,
  );
  assert.equal(store.state.accounts["customer-1"], walletBefore);
  passed(
    "finance reconciliation confirms the same customer payment and syncs the receipt",
  );
  await customer.screenshot({ path: out + "/customer-receipt.png" });

  await driver.getByRole("tab", { name: /Earnings/ }).click();
  await driver
    .getByRole("button", {
      name: "Request or view scheduled payout",
      exact: true,
    })
    .click();
  await expect(driver.getByText(/Available after reservations/)).toBeVisible();
  await driver
    .getByLabel("Withdrawal amount (UGX)", { exact: true })
    .fill("10000");
  await driver
    .getByRole("button", { name: "Airtel Money", exact: true })
    .click();
  await driver
    .getByLabel("Payout phone number", { exact: true })
    .fill("+256700123456");
  await driver
    .getByRole("button", { name: "Request withdrawal", exact: true })
    .click();
  await expect.poll(() => store.state.withdrawals.length).toBe(1);
  await dismissCelebration(driver);
  const withdrawal = store.state.withdrawals[0];
  assert.equal(withdrawal.status, "requested");
  assert.equal(withdrawal.amount, 10000);
  passed("driver submits an amount and destination visible to office");

  await admin.goto(base + "/operations/payouts");
  await admin
    .getByRole("button", { name: "Review request", exact: true })
    .click();
  await admin
    .getByLabel("Reason (required)")
    .fill("Office verified driver and destination");
  await admin
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await admin
    .getByRole("button", { name: "Finance payment", exact: true })
    .click();
  assert.equal(withdrawal.status, "approved");
  await admin
    .getByLabel("Provider payout charge (UGX)", { exact: true })
    .fill("500");
  await admin
    .getByRole("combobox", { name: "Charge paid by", exact: true })
    .click();
  await admin
    .getByRole("option", {
      name: "Deduct from the requested withdrawal",
      exact: true,
    })
    .click();
  await admin
    .getByRole("combobox", { name: "Demo payment outcome", exact: true })
    .click();
  await admin.getByRole("option", { name: "Failed", exact: true }).click();
  await admin
    .getByLabel("Reason (required)")
    .fill("Provider confirmed no transfer occurred");
  await admin
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await admin
    .getByRole("button", { name: "Retry payout", exact: true })
    .click();
  assert.equal(withdrawal.status, "failed");
  assert.equal(order.financial.disbursed, undefined);
  passed("office approval and confirmed payout failure leave earnings unpaid");

  await admin
    .getByRole("combobox", { name: "Demo payment outcome", exact: true })
    .click();
  await admin.getByRole("option", { name: "Pending", exact: true }).click();
  await admin
    .getByLabel("Finance / provider reference", { exact: true })
    .fill("airtel-review-payout-reference");
  await admin
    .getByLabel("Reason (required)")
    .fill("Airtel transfer result awaiting confirmation");
  await admin
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(
    admin.getByRole("button", { name: "Check payout result", exact: true }),
  ).toBeVisible();
  assert.equal(withdrawal.status, "processing");
  assert.equal(
    store.state.accounts["withdrawalClearing:" + withdrawal.id],
    10000,
  );
  passed(
    "pending payout reserves funding and keeps one withdrawal across retries",
  );

  await importReport(
    "payouts",
    "reference,amount,fee\nairtel-review-payout-reference,9500,500",
  );
  await admin
    .getByRole("button", { name: "Confirm existing payment", exact: true })
    .click();
  await admin
    .getByLabel("Reason (required)")
    .fill("Airtel report confirms net transfer and charge");
  await admin
    .getByRole("button", { name: "Confirm existing payment", exact: true })
    .click();
  await expect.poll(() => withdrawal.status).toBe("paid");
  await expect(
    driver.getByText("Amount received · UGX 9,500", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  assert.equal(withdrawal.attempts.length, 2);
  assert.equal(store.state.accounts["providerFees:airtel"], 500);
  assert.equal(store.state.accounts["external:airtel:+256700123456"], 9500);
  assert.equal(store.state.accounts["withdrawalClearing:" + withdrawal.id], 0);
  assert.equal(order.financial.disbursed, 10000);
  passed(
    "outgoing reconciliation posts net payout and charge once and syncs the driver receipt",
  );
  await dismissCelebration(driver);
  await driver
    .getByText("Amount received · UGX 9,500", { exact: true })
    .scrollIntoViewIfNeeded();
  await driver.screenshot({ path: out + "/driver-payout-receipt.png" });

  await importReport(
    "payouts",
    "reference,amount,fee\nairtel-review-payout-reference,9500,500\nairtel-review-payout-reference,9500,500\nunknown-reference,1000,0",
  );
  assert.deepEqual(
    store.state.reconciliations.at(-1).rows.map((r) => r.status),
    ["matched", "duplicate", "unexpected"],
  );
  await admin
    .getByRole("button", { name: "Duplicate explanation", exact: true })
    .focus();
  await expect(admin.getByRole("tooltip")).toBeVisible();
  passed(
    "reimport compares current records and identifies duplicate and unexpected provider rows",
  );
  await admin.screenshot({ path: out + "/reconciliation-results.png" });
  await importReport(
    "payouts",
    "reference,amount,fee\nunknown-reference,1000,0",
  );
  const missing = admin
    .getByRole("row")
    .filter({ has: admin.getByText("Missing", { exact: true }) });
  await expect(missing.getByRole("cell").nth(5)).toHaveText("UGX 9,500");
  await expect(missing.getByRole("cell").nth(6)).toHaveText("—");
  await expect(missing.getByRole("cell").nth(7)).toHaveText("UGX 500");
  await expect(missing.getByRole("cell").nth(8)).toHaveText("—");
  passed(
    "missing provider rows retain expected values while leaving provider amounts blank",
  );

  const cardId = await delivery("card");
  await openPayment(cardId);
  await customer
    .getByRole("button", { name: "DEMO OUTCOME CONTROLS", exact: true })
    .click();
  await customer.getByRole("radio", { name: "declined", exact: true }).click();
  await customer
    .getByRole("button", { name: "Confirm demo card payment", exact: true })
    .click();
  await customer
    .getByRole("radio", { name: "MTN Mobile Money", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Retry payment", exact: true })
    .click();
  await customer.getByRole("radio", { name: "timeout", exact: true }).click();
  await customer
    .getByRole("button", { name: "Approve demo payment", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Check payment status", exact: true })
    .click();
  await expect(
    customer.getByRole("button", { name: "Retry payment", exact: true }),
  ).toBeVisible();
  await customer
    .getByRole("radio", { name: "Demo Visa card", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Retry payment", exact: true })
    .click();
  await customer.getByRole("radio", { name: "success", exact: true }).click();
  await customer
    .getByRole("button", { name: "Confirm demo card payment", exact: true })
    .click();
  await expect
    .poll(() => store.order(cardId, "admin").payment.status)
    .toBe("paid");
  await dismissCelebration(customer);
  assert.equal(store.order(cardId, "admin").payment.attempts.length, 3);
  assert.equal(store.state.accounts["customer-1"], walletBefore);
  assert.equal(
    store.state.ledger.filter(
      (l) => l.kind === "collection" && l.reference === cardId,
    ).length,
    1,
  );
  passed(
    "card decline and no-charge mobile-money timeout can switch rails and settle once",
  );

  const walletOrderId = await delivery("wallet");
  const walletOrder = store.order(walletOrderId, "admin");
  store.state.accounts["customer-1"] = 0;
  await openPayment(walletOrderId);
  await customer
    .getByRole("button", { name: "Approve demo payment", exact: true })
    .click();
  await expect.poll(() => walletOrder.payment.status).toBe("failed");
  await customer
    .getByRole("button", { name: "Open wallet and add funds", exact: true })
    .click();
  await customer
    .getByLabel("Top-up amount", { exact: true })
    .fill(String(walletOrder.quote.total + 100));
  await customer
    .getByRole("button", { name: "Approve demo top-up", exact: true })
    .click();
  await expect
    .poll(() => store.state.walletTopups.at(-1)?.status)
    .toBe("completed");
  await customer
    .getByRole("button", { name: "Close wallet", exact: true })
    .click();
  await dismissCelebration(customer);
  await customer
    .getByRole("button", { name: "Retry payment", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Approve demo payment", exact: true })
    .click();
  await expect.poll(() => walletOrder.payment.status).toBe("paid");
  await dismissCelebration(customer);
  store.paid(walletOrder, walletOrder.payment.attempts.at(-1));
  assert.equal(store.state.accounts["customer-1"], 100);
  assert.equal(
    store.state.ledger.filter(
      (l) => l.kind === "wallet.collection" && l.reference === walletOrderId,
    ).length,
    1,
  );
  const cashId = await delivery("cash");
  const cashOrder = store.order(cashId, "admin");
  await call(`/orders/${cashId}/cargo`, "driver-1", {
    action: "cash-received",
    amount: cashOrder.quote.total,
  });
  await call(`/orders/${cashId}/payment`, "customer-1", {
    action: "confirm-cash",
  });
  assert.equal(cashOrder.financial.cash.feeDue, cashOrder.financial.fee);
  const incoming = await call("/admin/reconcile", "admin", { rows: [] });
  assert.equal(
    incoming.rows.some((r) => [walletOrderId, cashId].includes(r.orderId)),
    false,
  );
  passed(
    "insufficient wallet funds recover through the linked topup and cash stays outside provider matching",
  );

  await call(`/orders/${id}/admin`, "admin", {
    action: "refund",
    amount: 1000,
    key: "review-refund-attempt",
    outcome: "pending",
    reason: "Handling charge correction requested",
  });
  const walletAtRefund = store.state.accounts["customer-1"];
  await importReport("refunds", "reference,amount\nreview-refund-attempt,1000");
  await admin
    .getByRole("button", { name: "Confirm existing payment", exact: true })
    .click();
  await admin
    .getByLabel("Reason (required)")
    .fill("Provider confirms refund through original payment rail");
  await admin
    .getByRole("button", { name: "Confirm existing payment", exact: true })
    .click();
  await expect.poll(() => order.financial.refunded).toBe(1000);
  assert.equal(store.state.accounts["customer-1"], walletAtRefund);
  assert.equal(store.state.accounts["customer-1:mtn"], 1000);
  assert.equal(order.financial.refunded, 1000);
  await openPayment(id, false);
  await expect(
    customer.getByText("Refund history", { exact: true }),
  ).toBeVisible();
  await customer.screenshot({ path: out + "/customer-refund-receipt.png" });
  for (const entry of store.state.ledger)
    assert.equal(
      entry.entries.reduce((sum, e) => sum + e.amount, 0),
      0,
    );
  const unavailableWalletId = await delivery("wallet");
  store.state.accounts["customer-1"] = 0;
  await call(`/orders/${unavailableWalletId}/payment`, "customer-1", {
    action: "approve",
    scenario: "success",
  });
  await openPayment(unavailableWalletId, false);
  await customer
    .getByRole("button", { name: "Open wallet and add funds", exact: true })
    .click();
  await expect(
    customer.getByRole("radio", { name: "MTN Mobile Money", exact: true }),
  ).toBeVisible();
  await admin.goto(base + "/operations/methods");
  await expect(admin.getByRole("switch")).toHaveCount(7);
  await expect(
    admin.getByRole("columnheader", { name: "Account owner", exact: true }),
  ).toHaveCount(0);
  const mtnSwitch = admin.getByRole("switch", {
    name: "Accept MTN Mobile Money",
    exact: true,
  });
  await expect(mtnSwitch).toBeChecked();
  await mtnSwitch.click();
  await expect(mtnSwitch).not.toBeChecked();
  await expect(
    customer.getByRole("radio", { name: "MTN Mobile Money", exact: true }),
  ).toHaveCount(0, { timeout: 15000 });
  await expect(
    driver.getByRole("button", { name: "MTN Mobile Money", exact: true }),
  ).toHaveCount(0, { timeout: 15000 });
  await assert.rejects(
    call("/account/withdrawal", "driver-1", { method: "mtn", amount: 1000 }),
    /METHOD_DISABLED/,
  );
  await admin.screenshot({ path: out + "/platform-payment-methods.png" });
  await mtnSwitch.click();
  await expect(mtnSwitch).toBeChecked();
  await expect(
    customer.getByRole("radio", { name: "MTN Mobile Money", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    driver.getByRole("button", { name: "MTN Mobile Money", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  passed(
    "platform availability switches hide and restore methods in both apps and reject stale requests",
  );
  await customer
    .getByRole("button", { name: "Close wallet", exact: true })
    .click();

  writeFileSync(
    out + "/console-errors.json",
    JSON.stringify(consoleErrors, null, 2),
  );
  assert.deepEqual(
    consoleErrors.filter(
      (message) => !/Failed to load resource|net::ERR_|tiles/.test(message),
    ),
    [],
  );
  writeFileSync(
    out + "/network-errors.json",
    JSON.stringify(networkErrors, null, 2),
  );
  assert.deepEqual(networkErrors, []);
  assert.deepEqual(errors, []);
  passed("refund returns through original rail and all ledger entries balance");
  writeFileSync(
    out + "/results.json",
    JSON.stringify(
      {
        checks,
        errors,
        orders: store.state.orders.length,
        withdrawals: store.state.withdrawals.length,
        ledgerEntries: store.state.ledger.length,
      },
      null,
      2,
    ),
  );
} catch (error) {
  for (const [name, page] of [
    ["customer", customer],
    ["driver", driver],
    ["admin", admin],
  ]) {
    if (page && !page.isClosed()) {
      await page
        .screenshot({ path: out + "/" + name + "-failure.png", fullPage: true })
        .catch(() => {});
      writeFileSync(
        out + "/" + name + "-failure.txt",
        await page.locator("body").innerText(),
      );
    }
  }
  throw error;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
