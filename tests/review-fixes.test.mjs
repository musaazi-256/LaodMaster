import test from "node:test";
import assert from "node:assert/strict";
import { PlatformStore } from "../services/demo/platform.mjs";
const code = (c) => (e) => e.code === c;
const image = "data:image/png;base64,AAAA";
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
    "review-key-" + customer,
  );

test("snapshots only reveal order counterparties, without private account data", () => {
  const s = new PlatformStore();
  assert.deepEqual(s.snapshot("customer-1").people, []);
  const o = place(s);
  s.availability("driver-1", { online: true });
  s.accept("driver-1", o.id);
  const customerView = s.snapshot("customer-1").people;
  assert.deepEqual(
    customerView.map((p) => p.id),
    ["driver-1"],
  );
  assert.deepEqual(Object.keys(customerView[0]).sort(), [
    "id",
    "name",
    "phone",
    "plate",
    "role",
    "truckId",
    "vehicle",
  ]);
  const driverView = s.snapshot("driver-1").people;
  assert.deepEqual(driverView, [
    {
      id: "customer-1",
      role: "customer",
      name: "Alex Mukasa",
      phone: "+256 700 000 111",
    },
  ]);
  assert.ok(
    !s.snapshot("customer-2").people.some((p) => p.id === "customer-1"),
  );
});

test("selected and searched locations stay private to the account that chose them", () => {
  const s = new PlatformStore();
  const mine = s.mobile("customer-1", "location", {
    name: "Selected current location",
    latitude: 0.33,
    longitude: 32.6,
  });
  assert.ok(s.snapshot("customer-1").places.some((p) => p.id === mine.id));
  assert.ok(!s.snapshot("customer-2").places.some((p) => p.id === mine.id));
  assert.equal(
    s.quote("customer-1", {
      pickupId: mine.id,
      destinationId: "city",
      truckId: "small",
    }).pickup.id,
    mine.id,
  );
  assert.throws(
    () =>
      s.quote("customer-2", {
        pickupId: mine.id,
        destinationId: "city",
        truckId: "small",
      }),
    code("ROUTE_INVALID"),
  );
  assert.throws(
    () => s.mobile("customer-2", "place", { placeId: mine.id }),
    code("LOCATION_INVALID"),
  );
});

test("recovery for an unknown email never matches an account without a phone", () => {
  const s = new PlatformStore();
  const staff = s.adminAction("admin", "staff", {
    mode: "create",
    name: "No Phone",
    email: "nophone@loadmaster.test",
    role: "Admin",
  });
  const r = s.auth("recover", { identifier: "nobody@nowhere.test" });
  assert.equal(s.state.challenges[r.challenge].actor, null);
  assert.throws(
    () =>
      s.auth("verify", {
        challenge: r.challenge,
        code: r.demoCode,
        password: "Attacker123!",
      }),
    code("CODE_INVALID"),
  );
  const own = s.auth("recover", { identifier: "NoPhone@loadmaster.test" });
  assert.equal(s.state.challenges[own.challenge].actor, staff.id);
  const phone = s.auth("recover", { identifier: "+256 700 000 111" });
  assert.equal(s.state.challenges[phone.challenge].actor, "customer-1");
});

test("notifications without an order are not swallowed as duplicates", () => {
  const s = new PlatformStore();
  for (const name of ["Driver licence", "Identity document"])
    s.mobile("driver-2", "document", { name, content: image });
  const docs = s.state.profiles
    .find((p) => p.id === "driver-2")
    .documents.filter((d) => !d.demo);
  for (const d of docs)
    s.adminAction("admin", "document", {
      account: "driver-2",
      id: d.id,
      status: "rejected",
      reason: "Photo is blurry",
    });
  assert.equal(
    s
      .snapshot("driver-2")
      .notifications.filter((n) => n.title === "Document review").length,
    2,
  );
});

test("a driver backing out releases the order to other drivers instead of cancelling it", () => {
  const s = new PlatformStore();
  const o = place(s);
  s.availability("driver-1", { online: true });
  s.availability("driver-2", { online: true });
  s.accept("driver-1", o.id);
  s.advance("driver-1", o.id, { stage: "to_pickup" });
  const released = s.cancel("driver-1", o.id, { reason: "Truck broke down" });
  assert.equal(released.stage, "searching");
  assert.equal(released.driverId, null);
  assert.ok(!s.snapshot("driver-1").offers.some((x) => x.id === o.id));
  assert.ok(s.snapshot("driver-2").offers.some((x) => x.id === o.id));
  assert.ok(
    s
      .snapshot("customer-1")
      .notifications.some((n) => n.title === "Finding a new driver"),
  );
  assert.throws(() => s.accept("driver-1", o.id), code("OFFER_DECLINED"));
  s.accept("driver-2", o.id);
  assert.equal(s.order(o.id, "admin").driverId, "driver-2");
  assert.equal(
    s.cancel("customer-1", o.id, { reason: "Plans changed" }).stage,
    "cancelled",
  );
});
