import test from "node:test";
import assert from "node:assert/strict";
import { PlatformStore } from "../services/demo/platform.mjs";
const code = (c) => (e) => e.code === c;
const place = (s, customer = "customer-1") =>
  s.create(
    customer,
    {
      quoteId: s.quote(customer, {
        pickupId: "ntinda",
        destinationId: "nakawa",
        truckId: "small",
      }).id,
      method: "mtn",
    },
    "dispatch-key-" + customer,
  );
const expire = (s, orderId, driverId) => {
  const e = s
    .order(orderId, "admin")
    .dispatch.findLast((x) => x.driverId === driverId);
  e.expiresAt = new Date(Date.now() - 1000).toISOString();
};
const setup = () => {
  const s = new PlatformStore();
  s.availability("driver-1", { online: true });
  s.availability("driver-2", { online: true });
  return s;
};

test("a request is offered with a response window and appears in driver history", () => {
  const s = setup();
  const o = place(s);
  const snap = s.snapshot("driver-1");
  assert.equal(snap.offers.length, 1);
  assert.equal(snap.offers[0].id, o.id);
  const { offeredAt, expiresAt } = snap.offers[0].offer;
  assert.equal(
    Date.parse(expiresAt) - Date.parse(offeredAt),
    s.state.offerSeconds * 1000,
  );
  assert.equal(snap.requestHistory[0].status, "offered");
  // Polling again keeps the same offer instead of restarting the timer.
  assert.equal(s.snapshot("driver-1").offers[0].offer.expiresAt, expiresAt);
});

test("an unanswered request becomes missed, stays on record and goes to other drivers", () => {
  const s = setup();
  const o = place(s);
  s.snapshot("driver-1");
  s.snapshot("driver-2");
  expire(s, o.id, "driver-1");
  const snap = s.snapshot("driver-1");
  assert.equal(snap.offers.length, 0);
  assert.equal(snap.requestHistory[0].status, "missed");
  assert.ok(snap.notifications.some((n) => n.title === "Request missed"));
  assert.throws(() => s.accept("driver-1", o.id), code("OFFER_MISSED"));
  assert.equal(s.snapshot("driver-2").offers[0].id, o.id);
  s.accept("driver-2", o.id);
  const dispatch = s.adminSnapshot("admin").orders[0].dispatch;
  assert.deepEqual(
    dispatch.map((e) => [e.driverId, e.status]),
    [
      ["driver-1", "missed"],
      ["driver-2", "accepted"],
    ],
  );
});

test("a declined request keeps its record and reason for the driver and operations", () => {
  const s = setup();
  const o = place(s);
  s.snapshot("driver-1");
  s.decline("driver-1", o.id, { reason: "Too far from me" });
  const history = s.snapshot("driver-1").requestHistory;
  assert.equal(history[0].status, "declined");
  assert.equal(history[0].reason, "Too far from me");
  assert.equal(history[0].orderId, o.id);
  assert.equal(s.snapshot("driver-1").offers.length, 0);
  s.accept("driver-2", o.id);
  // The declined record survives the order being taken by someone else.
  assert.equal(s.snapshot("driver-1").requestHistory[0].status, "declined");
  const care = s.auth("login", {
    role: "staff",
    identifier: "joan@loadmaster.test",
    password: "DemoCargo2026!",
  });
  const seen = s.adminSnapshot(care.account).orders[0].dispatch;
  assert.equal(seen[0].status, "declined");
  assert.equal(seen[0].reason, "Too far from me");
});

test("open offers are withdrawn when another driver accepts, the customer cancels or the driver goes offline", () => {
  const s = setup();
  const o = place(s);
  s.snapshot("driver-1");
  s.snapshot("driver-2");
  s.accept("driver-2", o.id);
  assert.equal(s.snapshot("driver-1").requestHistory[0].status, "withdrawn");

  const t = new PlatformStore();
  t.availability("driver-1", { online: true });
  const c = place(t);
  t.snapshot("driver-1");
  t.cancel("customer-1", c.id, { reason: "Plans changed" });
  const h = t.snapshot("driver-1").requestHistory[0];
  assert.equal(h.status, "withdrawn");
  assert.equal(h.reason, "Customer cancelled the order");

  const u = new PlatformStore();
  u.availability("driver-1", { online: true });
  const d = place(u);
  u.snapshot("driver-1");
  u.availability("driver-1", { online: false });
  assert.equal(u.order(d.id, "admin").dispatch[0].status, "withdrawn");
  // Coming back online offers the same request again with a fresh window.
  u.availability("driver-1", { online: true });
  assert.equal(u.snapshot("driver-1").offers[0].id, d.id);
});

test("drivers see one request at a time and released or reassigned work is recorded", () => {
  const s = setup();
  const first = place(s, "customer-1");
  const second = place(s, "customer-2");
  assert.equal(s.snapshot("driver-1").offers[0].id, first.id);
  s.accept("driver-1", first.id);
  assert.equal(s.snapshot("driver-1").offers.length, 0);
  s.cancel("driver-1", first.id, { reason: "Vehicle problem" });
  const released = s
    .snapshot("driver-1")
    .requestHistory.find((h) => h.orderId === first.id);
  assert.equal(released.status, "released");
  assert.equal(s.snapshot("driver-1").offers[0].id, second.id);
  s.adminAction("admin", "dispatch", {
    id: first.id,
    driverId: "driver-2",
    reason: "Closest available truck",
  });
  const entry = s.order(first.id, "admin").dispatch.at(-1);
  assert.deepEqual(
    [entry.driverId, entry.status, entry.reason],
    ["driver-2", "accepted", "Assigned by operations"],
  );
});

test("operations can change the response window within limits", () => {
  const s = new PlatformStore();
  s.adminAction("admin", "settings", {
    feeRate: 0.15,
    helperRate: 12000,
    offerSeconds: 30,
  });
  assert.equal(s.state.offerSeconds, 30);
  assert.throws(
    () =>
      s.adminAction("admin", "settings", {
        feeRate: 0.15,
        helperRate: 12000,
        offerSeconds: 5,
      }),
    code("RATE_INVALID"),
  );
});
