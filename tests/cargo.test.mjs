import test from "node:test";
import assert from "node:assert/strict";
import { CargoStore } from "../services/demo/cargo.mjs";
const setup = (method = "mtn", n = 2, extra = {}) => {
  const s = new CargoStore();
  s.availability("driver-1", { online: true });
  const places = s.snapshot("customer-1").places;
  const stops = places
    .slice(1, n + 1)
    .map((p, i) => ({ id: "s" + i, placeId: p.id, helpers: 1 }));
  const q = s.quote("customer-1", {
    pickupId: places[0].id,
    destinationId: places[n].id,
    truckId: "large",
    loading: 1,
    stops,
  });
  const o = s.create(
    "customer-1",
    {
      quoteId: q.id,
      method,
      cargoPlan: {
        sender: { name: "Demo Sender", phone: "+256700000001" },
        items: stops.map((s, i) => ({
          description: "Demo cargo " + i,
          quantity: 2,
          weightKg: 10,
          stopId: s.id,
        })),
        stops: stops.map((s) => ({
          id: s.id,
          recipient: { name: "Demo Recipient", phone: "+256700000002" },
          pinRequired: true,
        })),
        payer: "customer",
        termsAccepted: true,
        ...extra,
      },
    },
    "cargo-test-order",
  );
  return { s, o, q };
};
const toStop = (s, o) => {
  for (const stage of [
    "to_pickup",
    "at_pickup",
    "loading",
    "in_transit",
    "at_destination",
    "offloading",
  ])
    s.advance("driver-1", o.id, { stage });
};
const deliver = (s, o) => {
  s.accept("driver-1", o.id);
  toStop(s, o);
  for (let i = 0; i < o.cargoPlan.stops.length; i++) {
    const stop = o.cargoPlan.stops[i];
    s.advance("driver-1", o.id, {
      stage: "delivered",
      confirmed: true,
      pin: s.snapshot("customer-1").orders[0].demoHandoverCodes[stop.id],
      stopId: stop.id,
    });
    if (i < o.cargoPlan.stops.length - 1) {
      s.advance("driver-1", o.id, { stage: "at_destination" });
      s.advance("driver-1", o.id, { stage: "offloading" });
    }
  }
};
test("cargo quote charges pickup once, handling per stop and validates capacity and recipient data", () => {
  const { s, o, q } = setup();
  assert.equal(q.loadingFee, 12000);
  assert.equal(q.offloadingFee, 24000);
  assert.equal(q.stopFee, 1500);
  assert.equal(q.total, q.transport + 37500);
  assert.equal(o.cargoPlan.items.length, 2);
  assert.equal(s.create("customer-1", {}, "cargo-test-order").id, o.id);
});
test("pairing is driver consent with eligibility checks and cannot be accepted by another driver", () => {
  const { s, o } = setup("mtn", 1, { pairCode: "2001" });
  s.availability("driver-2", { online: true });
  assert.throws(
    () => s.accept("driver-2", o.id),
    (e) => e.code === "PAIR_ONLY",
  );
  assert.equal(s.accept("driver-1", o.id).stage, "assigned");
  assert.throws(
    () => s.pair("customer-2", { code: "2001", truckId: "small" }),
    (e) => e.code === "DRIVER_UNAVAILABLE",
  );
});
test("multi-stop PINs are customer-only, failed codes do not advance and every stop needs handover", () => {
  const { s, o } = setup();
  s.accept("driver-1", o.id);
  toStop(s, o);
  assert.equal(s.snapshot("driver-1").orders[0].demoHandoverCodes, undefined);
  assert.throws(
    () =>
      s.advance("driver-1", o.id, {
        stage: "delivered",
        confirmed: true,
        pin: "wrong",
      }),
    (e) => e.code === "PIN_INVALID",
  );
  const pin = s.snapshot("customer-1").orders[0].demoHandoverCodes.s0;
  s.advance("driver-1", o.id, {
    stage: "delivered",
    confirmed: true,
    pin,
    stopId: "s0",
  });
  assert.equal(o.stage, "in_transit");
  assert.equal(o.currentStop, 1);
  assert.equal(o.payment.status, "not_due");
  s.advance("driver-1", o.id, {
    stage: "delivered",
    confirmed: true,
    pin,
    stopId: "s0",
  });
  assert.equal(o.currentStop, 1);
  s.advance("driver-1", o.id, { stage: "at_destination" });
  s.advance("driver-1", o.id, { stage: "offloading" });
  s.advance("driver-1", o.id, {
    stage: "delivered",
    confirmed: true,
    pin: s.snapshot("customer-1").orders[0].demoHandoverCodes.s1,
  });
  assert.equal(o.stage, "delivered");
});
test("cash collection requires driver declaration and payer confirmation; earnings are not paid twice", () => {
  const { s, o } = setup("cash", 1);
  deliver(s, o);
  assert.throws(
    () => s.payment("customer-1", o.id, { action: "confirm-cash" }),
    (e) => e.code === "CASH_NOT_RECORDED",
  );
  s.cargoAction("driver-1", o.id, {
    action: "cash-received",
    amount: o.quote.total,
  });
  s.payment("customer-1", o.id, { action: "confirm-cash" });
  assert.equal(o.financial.payoutStatus, "paid");
  assert.equal(s.state.accounts.settlement, 0);
  assert.equal(s.state.accounts["driverCash:driver-1"], o.financial.fee);
  assert.throws(() =>
    s.admin(o.id, {
      action: "payout",
      amount: o.financial.earning,
      reason: "Duplicate payout is invalid",
    }),
  );
  s.adminCash("admin", { id: o.id, reason: "Demo cash remittance verified" });
  assert.equal(s.state.accounts.settlement, o.financial.fee);
});
test("external wallets and FlexiPay simulate collection; LoadMaster wallet debits exactly once", () => {
  for (const method of ["flexipay", "external_wallet", "wallet"]) {
    const { s, o } = setup(method, 1, {
      externalWalletName: "SafeBoda Wallet (demo)",
    });
    if (method === "wallet")
      s.state.accounts["customer-1"] = o.quote.total + 100;
    deliver(s, o);
    s.payment("customer-1", o.id, { action: "approve", scenario: "success" });
    assert.equal(o.payment.status, "paid");
    if (method === "wallet") assert.equal(s.state.accounts["customer-1"], 100);
    assert.equal(s.state.accounts.settlement, o.quote.total);
  }
});
test("recipient payment requires explicit acceptance and cannot be approved by ordering customer", () => {
  const { s, o } = setup("flexipay", 1, { payer: "recipient" });
  const token = s.snapshot("customer-1").orders[0].recipientPayment.token;
  assert.equal(s.snapshot("driver-1").offers[0].recipientPayment, undefined);
  assert.throws(
    () => s.recipientPayment(token, { action: "approve", scenario: "success" }),
    (e) => e.code === "PAYER_ACCEPTANCE_REQUIRED",
  );
  s.recipientPayment(token, { action: "accept" });
  deliver(s, o);
  assert.throws(
    () =>
      s.payment("customer-1", o.id, { action: "approve", scenario: "success" }),
    (e) => e.code === "RECIPIENT_APPROVAL_REQUIRED",
  );
  s.recipientPayment(token, { action: "approve", scenario: "success" });
  assert.equal(o.payment.status, "paid");
});
test("order chat isolates accounts, shared links omit contact/PIN data and can be revoked", () => {
  const { s, o } = setup();
  s.accept("driver-1", o.id);
  const b = {
    action: "message",
    key: "message-1234",
    text: "At the loading gate",
  };
  s.cargoAction("customer-1", o.id, b);
  s.cargoAction("customer-1", o.id, b);
  assert.equal(o.messages.length, 1);
  assert.throws(() => s.cargoAction("customer-2", o.id, b));
  const share = s.cargoAction("customer-1", o.id, { action: "share" });
  const token = share.path.split("/").at(-1);
  const shared = s.tracking(token);
  assert.equal(JSON.stringify(shared).includes("+256"), false);
  s.cargoAction("customer-1", o.id, { action: "revoke-share" });
  assert.throws(() => s.tracking(token));
});
test("failed stop requires supervisor for return, preserves custody and records final handover", () => {
  const { s, o } = setup("cash", 1);
  s.accept("driver-1", o.id);
  toStop(s, o);
  s.cargoAction("driver-1", o.id, {
    action: "failed-stop",
    reason: "Recipient unavailable",
  });
  assert.throws(() =>
    s.cancel("customer-1", o.id, { reason: "Cancel cargo in custody" }),
  );
  assert.throws(() =>
    s.adminAction("staff-5", "cargo", {
      id: o.id,
      action: "return",
      reason: "Return failed cargo",
    }),
  );
  s.adminAction("admin", "cargo", {
    id: o.id,
    action: "return",
    reason: "Sender authorized cargo return",
  });
  assert.equal(o.stage, "returning");
  s.adminAction("admin", "cargo", {
    id: o.id,
    action: "returned",
    confirmed: true,
    reason: "Sender confirmed handover",
  });
  assert.equal(o.stage, "returned");
  assert.equal(o.cargoPlan.stops[0].status, "returned");
});

test("wallet insufficient funds stays retryable without a collection or duplicate debit", () => {
  const { s, o } = setup("wallet", 1);
  deliver(s, o);
  s.payment("customer-1", o.id, { action: "approve", scenario: "success" });
  assert.equal(o.payment.status, "failed");
  assert.equal(s.state.accounts.settlement, 0);
  s.payment("customer-1", o.id, { action: "retry", method: "flexipay" });
  s.payment("customer-1", o.id, { action: "approve", scenario: "success" });
  assert.equal(o.payment.status, "paid");
  assert.equal(s.state.accounts.settlement, o.quote.total);
});

test("cash received after a reserve guarantee does not credit driver earning twice", () => {
  const { s, o } = setup("cash", 1);
  deliver(s, o);
  s.admin(
    o.id,
    {
      action: "guarantee",
      amount: o.financial.earning,
      reason: "Customer collection pending",
      key: "reserve-cash-test",
      outcome: "success",
    },
    "admin",
  );
  const before = s.state.accounts["driver-1"];
  s.cargoAction("driver-1", o.id, {
    action: "cash-received",
    amount: o.quote.total,
  });
  s.payment("customer-1", o.id, { action: "confirm-cash" });
  assert.equal(s.state.accounts["driver-1"], before);
  assert.equal(s.state.accounts["driverCash:driver-1"], o.quote.total);
  s.adminCash("admin", { id: o.id, reason: "Full collected cash remitted" });
  assert.equal(s.state.accounts.settlement, o.quote.total);
});

test("recipient refunds never credit the ordering customer wallet", () => {
  const { s, o } = setup("flexipay", 1, { payer: "recipient" });
  const token = s.state.recipientLinks[0].token;
  s.recipientPayment(token, { action: "accept" });
  deliver(s, o);
  s.recipientPayment(token, { action: "approve", scenario: "success" });
  const before = s.state.accounts["customer-1"];
  s.admin(
    o.id,
    {
      action: "refund",
      amount: 1000,
      key: "recipient-refund-test",
      reason: "Overcharge confirmed",
      outcome: "success",
    },
    "admin",
  );
  assert.equal(s.state.accounts["customer-1"], before);
  assert.equal(s.state.accounts["recipient:" + o.id], 1000);
});

test("failed cargo remains in custody after other deliveries until return handover", () => {
  const { s, o } = setup("mtn", 2);
  s.accept("driver-1", o.id);
  toStop(s, o);
  s.cargoAction("driver-1", o.id, {
    action: "failed-stop",
    reason: "Recipient unavailable",
  });
  s.adminAction("admin", "cargo", {
    id: o.id,
    action: "skip-failed",
    reason: "Continue then return failed cargo",
  });
  s.advance("driver-1", o.id, { stage: "at_destination" });
  s.advance("driver-1", o.id, { stage: "offloading" });
  s.advance("driver-1", o.id, {
    stage: "delivered",
    confirmed: true,
    pin: s.state.handoverCodes[o.id].s1,
    stopId: "s1",
  });
  assert.equal(o.stage, "returning");
  assert.equal(o.payment.status, "not_due");
  s.adminAction("admin", "cargo", {
    id: o.id,
    action: "returned",
    confirmed: true,
    reason: "Sender received remaining cargo",
  });
  assert.equal(o.stage, "returned");
  assert.equal(o.cargoPlan.stops[0].status, "returned");
  assert.equal(o.cargoPlan.stops[1].status, "delivered");
});

test("cargo validation rejects duplicate destinations, invalid recipients and overweight combined loads", () => {
  const { s, q } = setup();
  assert.throws(
    () =>
      s.quote("customer-2", {
        pickupId: "ntinda",
        truckId: "small",
        loading: 0,
        stops: [
          { id: "a", placeId: "nakawa", helpers: 0 },
          { id: "b", placeId: "nakawa", helpers: 0 },
        ],
      }),
    (e) => e.code === "STOPS_INVALID",
  );
  const q2 = s.quote("customer-2", {
    pickupId: q.pickup.id,
    truckId: "small",
    loading: 0,
    stops: [{ id: "a", placeId: q.stops[0].place.id, helpers: 0 }],
  });
  const body = {
    quoteId: q2.id,
    method: "mtn",
    cargoPlan: {
      sender: { name: "Sender", phone: "+256700000001" },
      payer: "customer",
      termsAccepted: true,
      items: [
        {
          description: "Heavy load",
          quantity: 1,
          weightKg: 999999,
          stopId: "a",
        },
      ],
      stops: [{ id: "a", recipient: { name: "Receiver", phone: "bad" } }],
    },
  };
  assert.throws(
    () => s.create("customer-2", body, "invalid-cargo-load"),
    (e) => e.code === "CAPACITY_MISMATCH",
  );
  body.cargoPlan.items[0].weightKg = 1;
  assert.throws(
    () => s.create("customer-2", body, "invalid-cargo-contact"),
    (e) => e.code === "CONTACT_REQUIRED",
  );
});

test("public recipient link exposes only its payment and rejects unaccepted charges over HTTP", async () => {
  const { createServer } = await import("../services/demo/server.mjs");
  const { s, o } = setup("flexipay", 1, { payer: "recipient" });
  const server = createServer(s);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const token = s.state.recipientLinks[0].token;
    const page = await (await fetch(base + "/pay/" + token)).text();
    assert.ok(page.includes("Accept transport payment request"));
    assert.ok(!page.includes("+256"));
    let r = await fetch(base + "/pay/" + token + "/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", scenario: "success" }),
    });
    assert.equal(r.status, 403);
    r = await fetch(base + "/pay/" + token + "/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    assert.equal(r.status, 200);
    deliver(s, o);
    r = await fetch(base + "/pay/" + token + "/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", scenario: "success" }),
    });
    assert.equal(r.status, 200);
    assert.equal(o.payment.status, "paid");
    assert.equal((await fetch(base + "/pay/" + "a".repeat(32))).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("driver ID resolves to the same eligible driver as a short pairing number", () => {
  const s = new CargoStore();
  s.availability("driver-1", { online: true });
  const byId = s.pair("customer-1", { code: "driver-1", truckId: "small" });
  const byCode = s.pair("customer-1", {
    code: byId.pairCode,
    truckId: "small",
  });
  assert.equal(byId.id, byCode.id);
  s.availability("driver-1", { online: false });
  assert.throws(
    () => s.pair("customer-1", { code: "driver-1", truckId: "small" }),
    /unavailable/,
  );
});

test("external trip payment preserves wallet, records its rail and notifies both participants once", () => {
  for (const method of ["mtn", "airtel", "card"]) {
    const { s, o } = setup(method, 1);
    s.state.accounts["customer-1"] = o.quote.total + 500;
    const before = s.state.accounts["customer-1"];
    deliver(s, o);
    const a = o.payment.attempts[0];
    assert.equal(a.method, method);
    assert.equal(a.amount, o.quote.total);
    assert.equal(a.driverId, "driver-1");
    s.payment("customer-1", o.id, { action: "approve", scenario: "success" });
    s.paid(o, a);
    assert.equal(s.state.accounts["customer-1"], before);
    const ledger = s.state.ledger.filter(
      (l) => l.kind === "collection" && l.reference === o.id,
    );
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].entries[0].account, "provider:" + method);
    assert.equal(
      s
        .snapshot("driver-1")
        .notifications.filter((n) => n.title === "Customer payment received")
        .length,
      1,
    );
    s.admin(
      o.id,
      {
        action: "refund",
        amount: 1000,
        reason: "Fare correction",
        key: "refund-rail-" + method,
        outcome: "success",
      },
      "admin",
    );
    assert.equal(s.state.accounts["customer-1"], before);
    assert.equal(s.state.accounts["customer-1:" + method], 1000);
  }
});

test("provider reconciliation excludes wallet and cash and identifies delayed confirmations", () => {
  for (const method of ["wallet", "cash"]) {
    const { s, o } = setup(method, 1);
    s.state.accounts["customer-1"] = o.quote.total;
    deliver(s, o);
    if (method === "cash") {
      s.cargoAction("driver-1", o.id, {
        action: "cash-received",
        amount: o.quote.total,
      });
      s.payment("customer-1", o.id, { action: "confirm-cash" });
    } else
      s.payment("customer-1", o.id, { action: "approve", scenario: "success" });
    assert.deepEqual(
      s.adminAction("admin", "reconcile", { rows: [] }).rows,
      [],
    );
  }
  const { s, o } = setup("mtn", 1);
  deliver(s, o);
  s.payment("customer-1", o.id, { action: "approve", scenario: "delayed" });
  const rows = [{ reference: o.payment.attempts[0].id, amount: o.quote.total }];
  assert.equal(
    s.adminAction("admin", "reconcile", { rows }).rows[0].status,
    "confirmation_pending",
  );
  assert.equal(o.payment.status, "unknown");
  s.payment("customer-1", o.id, { action: "resolve" });
  assert.equal(
    s.adminAction("admin", "reconcile", { rows }).rows[0].status,
    "matched",
  );
  assert.throws(
    () =>
      s.adminAction("admin", "reconcile", {
        rows: [{ reference: rows[0].reference, amount: -1 }],
      }),
    (e) => e.code === "IMPORT_INVALID",
  );
});
