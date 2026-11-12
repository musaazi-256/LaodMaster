import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CargoStore } from "../services/demo/cargo.mjs";
import { METHODS } from "../services/demo/model.mjs";
import { availablePaymentMethods } from "../packages/contracts/src/index.ts";

const code = (value) => (error) => error.code === value;
const toggle = (s, method, enabled) =>
  s.adminAction("admin", "payment-method", {
    method,
    enabled,
    reason: enabled
      ? "Provider service restored"
      : "Provider service is experiencing an outage",
  });
function order(s, method = "mtn") {
  const quote = s.quote("customer-1", {
    pickupId: "ntinda",
    destinationId: "nakawa",
    truckId: "small",
    loading: 0,
  });
  return s.create(
    "customer-1",
    { quoteId: quote.id, method },
    "method-order-" + s.state.orders.length,
  );
}
function deliver(s, o) {
  s.availability("driver-1", { online: true });
  s.accept("driver-1", o.id);
  for (const stage of [
    "to_pickup",
    "at_pickup",
    "loading",
    "in_transit",
    "at_destination",
    "offloading",
    "delivered",
  ])
    s.advance("driver-1", o.id, { stage, confirmed: true });
}

test("platform methods are a unique catalogue independent of saved customer methods", () => {
  const s = new CargoStore();
  assert.deepEqual(
    s.adminSnapshot("admin").paymentMethods.map((m) => m.method),
    METHODS,
  );
  assert.equal(
    s
      .adminSnapshot("admin")
      .paymentMethods.some((m) => "owner" in m || "last4" in m),
    false,
  );
  const saved = structuredClone(s.profile("customer-1").paymentMethods);
  toggle(s, "mtn", false);
  assert.equal(s.snapshot("customer-1").acceptedMethods.includes("mtn"), false);
  assert.equal(s.snapshot("driver-1").acceptedMethods.includes("mtn"), false);
  assert.deepEqual(s.profile("customer-1").paymentMethods, saved);
  assert.equal(s.state.audit.at(-1).action, "payment_method.updated");
  assert.throws(
    () =>
      s.adminAction("staff-3", "payment-method", {
        method: "mtn",
        enabled: true,
        reason: "Unauthorized availability update",
      }),
    code("FORBIDDEN"),
  );
  assert.throws(
    () =>
      s.adminAction("admin", "payment-method", {
        method: "mtn",
        enabled: "true",
        reason: "",
      }),
    code("METHOD_INVALID"),
  );
});

test("disabled methods cannot create trips, topups, saved methods or withdrawal requests", () => {
  const s = new CargoStore();
  const o = order(s);
  deliver(s, o);
  s.payment("customer-1", o.id, { action: "approve", scenario: "success" });
  toggle(s, "mtn", false);
  assert.throws(() => order(s), code("METHOD_DISABLED"));
  assert.throws(
    () =>
      s.mobile("customer-1", "wallet", {
        key: "disabled-topup-request",
        method: "mtn",
        amount: 1000,
        outcome: "success",
      }),
    code("METHOD_DISABLED"),
  );
  assert.throws(
    () =>
      s.mobile("customer-1", "methods", {
        kind: "mtn",
        label: "Unavailable operator",
      }),
    code("METHOD_DISABLED"),
  );
  assert.throws(
    () => s.mobile("driver-1", "withdrawal", { method: "mtn", amount: 1000 }),
    code("METHOD_DISABLED"),
  );
  assert.equal(o.payment.status, "paid");
  toggle(s, "mtn", true);
  assert.equal(s.snapshot("customer-1").acceptedMethods.includes("mtn"), true);
  assert.equal(
    s.mobile("driver-1", "withdrawal", { method: "mtn", amount: 1000 }).status,
    "requested",
  );
});

test("disabling a queued collection requires checking the existing request before retrying", () => {
  const s = new CargoStore();
  const o = order(s);
  deliver(s, o);
  toggle(s, "mtn", false);
  assert.equal(o.payment.status, "unknown");
  assert.throws(
    () =>
      s.payment("customer-1", o.id, { action: "approve", scenario: "success" }),
    code("METHOD_DISABLED"),
  );
  assert.throws(
    () => s.payment("customer-1", o.id, { action: "retry", method: "airtel" }),
    code("ATTEMPT_PENDING"),
  );
  s.payment("customer-1", o.id, { action: "resolve" });
  assert.equal(o.payment.status, "failed");
  s.payment("customer-1", o.id, { action: "retry", method: "airtel" });
  s.payment("customer-1", o.id, { action: "approve", scenario: "success" });
  assert.equal(o.payment.status, "paid");
  assert.equal(o.method, "airtel");
  assert.equal(o.payment.attempts.length, 2);
  assert.equal(s.state.ledger.filter((l) => l.kind === "collection").length, 1);
});

test("a method disabled before handover creates no external collection request", () => {
  const s = new CargoStore();
  const o = order(s);
  toggle(s, "mtn", false);
  deliver(s, o);
  assert.equal(o.stage, "delivered");
  assert.equal(o.payment.status, "failed");
  assert.equal(s.state.ledger.filter((l) => l.kind === "collection").length, 0);
  assert.equal(
    s.state.notifications.some(
      (n) => n.orderId === o.id && n.title === "Payment requested",
    ),
    false,
  );
});

test("disabled rails still resolve uncertain collections and wallet funding", () => {
  const s = new CargoStore();
  const o = order(s);
  deliver(s, o);
  s.payment("customer-1", o.id, { action: "approve", scenario: "delayed" });
  const topup = s.mobile("customer-1", "wallet", {
    method: "mtn",
    amount: 1000,
    outcome: "pending",
    key: "existing-uncertain-topup",
  });
  toggle(s, "mtn", false);
  s.payment("customer-1", o.id, { action: "resolve" });
  s.mobile("customer-1", "wallet", { key: topup.id, resolve: true });
  assert.equal(o.payment.status, "paid");
  assert.equal(s.state.walletTopups[0].status, "completed");
  assert.equal(s.snapshot("customer-1").acceptedMethods.includes("mtn"), false);
});

test("finance cannot initiate disabled payouts but can confirm a pending transfer", () => {
  const s = new CargoStore();
  const o = order(s);
  deliver(s, o);
  s.payment("customer-1", o.id, { action: "approve", scenario: "success" });
  const w = s.mobile("driver-1", "withdrawal", {
    method: "airtel",
    amount: 1000,
  });
  const step = (b) =>
    s.adminAction("admin", "withdrawal", {
      id: w.id,
      reason: "Finance verified provider response",
      ...b,
    });
  step({ status: "approved" });
  toggle(s, "airtel", false);
  assert.throws(
    () =>
      step({
        status: "pay",
        outcome: "success",
        key: "unavailable-payout-attempt",
        reference: "unavailable-provider-ref",
      }),
    code("METHOD_DISABLED"),
  );
  toggle(s, "airtel", true);
  step({
    status: "pay",
    outcome: "pending",
    key: "pending-method-payout",
    reference: "pending-method-provider-ref",
  });
  toggle(s, "airtel", false);
  step({
    status: "resolve",
    outcome: "success",
    reference: "pending-method-provider-ref",
  });
  assert.equal(w.status, "paid");
});

test("availability persists and an empty enabled set stays empty in app choices", () => {
  const directory = mkdtempSync(join(tmpdir(), "loadmaster-methods-"));
  try {
    const file = join(directory, "state.json");
    let s = new CargoStore(file);
    for (const method of METHODS) toggle(s, method, false);
    s = new CargoStore(file);
    assert.deepEqual(availablePaymentMethods(s.snapshot("customer-1")), []);
    assert.deepEqual(availablePaymentMethods(s.snapshot("driver-1")), []);
    assert.deepEqual(availablePaymentMethods(null), []);
    assert.equal(
      s.adminSnapshot("admin").paymentMethods.length,
      METHODS.length,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
