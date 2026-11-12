import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../services/demo/model.mjs";
const quote = (s, actor = "customer-1", extra = {}) =>
  s.quote(actor, {
    pickupId: "ntinda",
    destinationId: "city",
    truckId: "small",
    ...extra,
  });
const order = (s, actor = "customer-1", extra = {}) =>
  s.create(
    actor,
    { quoteId: quote(s, actor).id, method: "mtn", ...extra },
    "test-key-" + actor,
  );
const online = (s, id = "driver-1") => s.availability(id, { online: true });
const deliver = (s, o) => {
  online(s);
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
  return o;
};
const code = (c) => (e) => e.code === c;
test("quote itemizes both handling locations and rejects an invalid route", () => {
  const s = new Store();
  const q = quote(s, "customer-1", { loading: 2, offloading: 1 });
  assert.equal(q.total, q.transport + 36000);
  assert.equal(q.loadingFee, 24000);
  assert.throws(
    () => quote(s, "customer-1", { destinationId: "ntinda" }),
    code("ROUTE_INVALID"),
  );
  assert.throws(
    () => quote(s, "customer-1", { loading: -1 }),
    code("HANDLING_INVALID"),
  );
});
test("order retries return exactly the same record, even after quote expiry", () => {
  const s = new Store();
  const q = quote(s);
  const b = { quoteId: q.id, method: "card" };
  const first = s.create("customer-1", b, "stable-reference");
  q.expiresAt = "2000-01-01";
  const second = s.create("customer-1", b, "stable-reference");
  assert.equal(first.id, second.id);
  assert.equal(s.state.orders.length, 1);
  assert.throws(
    () => s.create("customer-1", b, "other-reference"),
    code("QUOTE_EXPIRED"),
  );
});
test("one immediate active order per customer and account isolation", () => {
  const s = new Store();
  const o = order(s);
  assert.throws(
    () =>
      s.create(
        "customer-1",
        { quoteId: quote(s).id, method: "mtn" },
        "second-reference",
      ),
    code("ACTIVE_ORDER"),
  );
  assert.throws(() => s.order(o.id, "customer-2"), code("FORBIDDEN"));
  assert.equal(s.snapshot("customer-2").orders.length, 0);
});
test("offline, unverified, busy and undersized drivers cannot receive or accept unsuitable requests", () => {
  const s = new Store();
  const q = quote(s, "customer-1", { truckId: "large" });
  const o = order(s, "customer-1", { quoteId: q.id });
  assert.equal(s.snapshot("driver-1").offers.length, 0);
  assert.throws(() => s.accept("driver-1", o.id), code("DRIVER_UNAVAILABLE"));
  online(s, "driver-2");
  assert.equal(s.snapshot("driver-2").offers.length, 0);
  assert.throws(() => s.accept("driver-2", o.id), code("CAPACITY_MISMATCH"));
  s.state.profiles.find((p) => p.id === "driver-1").verified = false;
  assert.throws(() => online(s), code("VERIFICATION_REQUIRED"));
});
test("larger vehicle receives smaller loads and one acceptance wins", () => {
  const s = new Store();
  const o = order(s);
  online(s);
  online(s, "driver-2");
  assert.equal(s.snapshot("driver-1").offers[0].id, o.id);
  s.accept("driver-1", o.id);
  assert.throws(
    () => s.accept("driver-2", o.id),
    (e) => ["FORBIDDEN", "OFFER_UNAVAILABLE"].includes(e.code),
  );
  assert.equal(s.snapshot("customer-1").orders[0].driverId, "driver-1");
  assert.equal(s.snapshot("driver-1").offers.length, 0);
  assert.equal(s.state.orders.filter((x) => x.driverId).length, 1);
});
test("busy driver cannot accept another request", () => {
  const s = new Store();
  const one = order(s);
  online(s);
  s.accept("driver-1", one.id);
  const two = order(s, "customer-2");
  assert.throws(() => s.accept("driver-1", two.id), code("DRIVER_BUSY"));
  assert.equal(s.snapshot("driver-1").offers.length, 0);
});
test("decline is driver-specific and cancellation removes all offers", () => {
  const s = new Store();
  const o = order(s);
  online(s);
  online(s, "driver-2");
  s.decline("driver-1", o.id);
  assert.equal(s.snapshot("driver-1").offers.length, 0);
  assert.equal(s.snapshot("driver-2").offers.length, 1);
  s.cancel("customer-1", o.id, { reason: "Plans changed" });
  assert.equal(s.snapshot("driver-2").offers.length, 0);
});
test("future scheduled requests stay out of offers until due", () => {
  const s = new Store();
  const o = order(s, "customer-1", {
    scheduledAt: new Date(Date.now() + 3600000).toISOString(),
  });
  online(s);
  assert.equal(s.snapshot("driver-1").offers.length, 0);
  o.scheduledAt = new Date(Date.now() - 1000).toISOString();
  assert.equal(s.snapshot("driver-1").offers[0].id, o.id);
});
test("only assigned driver may advance; cannot skip delivery or cancel cargo in custody", () => {
  const s = new Store();
  const o = order(s);
  online(s);
  s.accept("driver-1", o.id);
  assert.throws(
    () => s.advance("driver-2", o.id, { stage: "to_pickup" }),
    code("FORBIDDEN"),
  );
  assert.throws(
    () => s.advance("driver-1", o.id, { stage: "delivered" }),
    code("STAGE_CONFLICT"),
  );
  for (const stage of ["to_pickup", "at_pickup", "loading"])
    s.advance("driver-1", o.id, { stage });
  assert.throws(
    () => s.cancel("customer-1", o.id, { reason: "Changed mind" }),
    code("CANCEL_UNAVAILABLE"),
  );
});
test("handover required; completion creates exactly one payment attempt and earning entitlement", () => {
  const s = new Store();
  const o = order(s);
  online(s);
  s.accept("driver-1", o.id);
  for (const stage of [
    "to_pickup",
    "at_pickup",
    "loading",
    "in_transit",
    "at_destination",
    "offloading",
  ])
    s.advance("driver-1", o.id, { stage });
  assert.throws(
    () => s.advance("driver-1", o.id, { stage: "delivered" }),
    code("HANDOVER_REQUIRED"),
  );
  s.advance("driver-1", o.id, { stage: "delivered", confirmed: true });
  s.advance("driver-1", o.id, { stage: "delivered", confirmed: true });
  assert.equal(o.payment.attempts.length, 1);
  assert.equal(o.payment.status, "awaiting_approval");
  assert.equal(o.financial.payoutStatus, "scheduled");
  assert.throws(() => s.advance("driver-1", o.id, {}), code("STAGE_CONFLICT"));
});
test("successful card simulation produces one receipt and preserves earning/payout separation", () => {
  const s = new Store();
  const o = deliver(s, order(s, "customer-1", { method: "card" }));
  s.payment("customer-1", o.id, { action: "approve", scenario: "success" });
  assert.equal(o.payment.status, "paid");
  assert.ok(o.payment.reference);
  assert.ok(o.payment.paidAt);
  assert.equal(o.financial.earning + o.financial.fee, o.quote.total);
  assert.equal(o.financial.payoutStatus, "scheduled");
  assert.throws(
    () =>
      s.payment("customer-1", o.id, { action: "approve", scenario: "success" }),
    code("ALREADY_PAID"),
  );
  assert.equal(o.payment.attempts.length, 1);
});
for (const scenario of ["declined", "insufficient"])
  test(`${scenario}: retry uses a distinct attempt against the same obligation`, () => {
    const s = new Store();
    const o = deliver(s, order(s));
    s.payment("customer-1", o.id, { action: "approve", scenario });
    assert.equal(o.stage, "delivered");
    assert.equal(o.payment.status, "failed");
    const original = o.payment.attempts[0].id;
    s.payment("customer-1", o.id, { action: "retry", method: "airtel" });
    assert.equal(o.payment.attempts.length, 2);
    assert.notEqual(o.payment.attempts[1].id, original);
    s.payment("customer-1", o.id, { action: "approve", scenario: "success" });
    assert.equal(o.payment.status, "paid");
  });
test("timeout requires status resolution before retry; delayed success never starts a second attempt", () => {
  for (const scenario of ["timeout", "delayed"]) {
    const s = new Store();
    const o = deliver(s, order(s));
    s.payment("customer-1", o.id, { action: "approve", scenario });
    assert.equal(o.payment.status, "unknown");
    assert.throws(
      () => s.payment("customer-1", o.id, { action: "retry", method: "mtn" }),
      code("ATTEMPT_PENDING"),
    );
    s.payment("customer-1", o.id, { action: "resolve" });
    assert.equal(o.payment.status, scenario === "delayed" ? "paid" : "failed");
    assert.equal(o.payment.attempts.length, 1);
  }
});
test("refund is capped, original-method linked, reasoned, and idempotent", () => {
  const s = new Store();
  const o = deliver(s, order(s));
  s.payment("customer-1", o.id, { action: "approve", scenario: "success" });
  const b = {
    action: "refund",
    amount: 10000,
    reason: "Handling was not supplied",
    key: "refund-reference",
  };
  s.admin(o.id, b);
  s.admin(o.id, b);
  assert.equal(o.financial.refunded, 10000);
  assert.equal(o.financial.events[0].destination, "customer-1:mtn");
  assert.throws(
    () => s.admin(o.id, { ...b, key: "another-refund", amount: o.quote.total }),
    code("REFUND_LIMIT"),
  );
  assert.ok(s.state.audit.some((x) => x.action === "refund"));
});
test("platform-funded driver payment does not settle customer debt or pay the driver twice", () => {
  const s = new Store();
  const o = deliver(s, order(s));
  s.payment("customer-1", o.id, { action: "approve", scenario: "declined" });
  const b = {
    action: "guarantee",
    amount: o.financial.earning,
    reason: "Verified demo delivery unpaid",
    key: "guarantee-reference",
  };
  s.admin(o.id, b);
  s.admin(o.id, b);
  assert.equal(o.financial.payoutStatus, "paid");
  assert.equal(o.payment.status, "failed");
  s.payment("customer-1", o.id, { action: "retry", method: "mtn" });
  s.payment("customer-1", o.id, { action: "approve", scenario: "success" });
  assert.equal(o.financial.payoutStatus, "paid");
  assert.throws(
    () =>
      s.admin(o.id, { ...b, action: "payout", key: "other-payout-reference" }),
    code("PAYOUT_UNAVAILABLE"),
  );
});
test("orders, attempts, issues and operation keys survive service restart", () => {
  const dir = mkdtempSync(join(tmpdir(), "loadmaster-test-"));
  try {
    const file = join(dir, "state.json");
    const s = new Store(file);
    const o = deliver(s, order(s));
    s.issue("customer-1", o.id, { message: "A box is damaged" });
    const restored = new Store(file);
    assert.equal(restored.snapshot("customer-1").orders[0].id, o.id);
    assert.equal(restored.order(o.id, "customer-1").issues.length, 1);
    assert.equal(restored.order(o.id, "customer-1").payment.attempts.length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an unassigned driver cannot cancel or attach an issue to another customer order", () => {
  const s = new Store();
  const o = order(s);
  assert.throws(
    () => s.cancel("driver-1", o.id, { reason: "Not my order" }),
    code("FORBIDDEN"),
  );
  assert.throws(
    () => s.issue("driver-1", o.id, { message: "Not my delivery" }),
    code("FORBIDDEN"),
  );
  assert.equal(o.stage, "searching");
  assert.equal(o.issues.length, 0);
});
test("due scheduled orders wait for the customer’s current order to finish", () => {
  const s = new Store();
  const first = order(s);
  const q = quote(s);
  const scheduled = s.create(
    "customer-1",
    {
      quoteId: q.id,
      method: "card",
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    },
    "scheduled-second-reference",
  );
  scheduled.scheduledAt = new Date(Date.now() - 1000).toISOString();
  online(s);
  assert.deepEqual(
    s.snapshot("driver-1").offers.map((o) => o.id),
    [first.id],
  );
  assert.equal(scheduled.stage, "scheduled");
  s.cancel("customer-1", first.id, { reason: "First order cancelled" });
  assert.equal(s.snapshot("driver-1").offers[0].id, scheduled.id);
});
test("insufficient platform funds leaves the driver entitlement and audit unchanged", () => {
  const s = new Store();
  const o = deliver(s, order(s));
  s.state.funding = 0;
  const audit = s.state.audit.length;
  assert.throws(
    () =>
      s.admin(o.id, {
        action: "guarantee",
        amount: o.financial.earning,
        reason: "Protect driver earnings",
        key: "funding-failure-reference",
      }),
    code("INSUFFICIENT_FUNDS"),
  );
  assert.equal(o.financial.payoutStatus, "scheduled");
  assert.equal(o.financial.events.length, 0);
  assert.equal(s.state.audit.length, audit);
});
