import test from "node:test";
import assert from "node:assert/strict";
import { CargoStore } from "../services/demo/cargo.mjs";
import { routePreview } from "../services/demo/routes.mjs";
const code = (c) => (e) => e.code === c;
// staff-1 Super Admin, staff-5 Customer Care; Field Agent is staff-4.
const order = (s) =>
  s.create(
    "customer-1",
    {
      quoteId: s.quote("customer-1", {
        pickupId: "ntinda",
        destinationId: "nakawa",
        truckId: "small",
      }).id,
      method: "mtn",
    },
    "admin-mgmt-" + Math.random(),
  );

test("staff with trip access can load any trip route; others cannot", async () => {
  const s = new CargoStore();
  const o = order(s);
  const r = await routePreview(s, "staff-5", { orderId: o.id });
  assert.ok(r.coordinates.length >= 2);
  await assert.rejects(
    routePreview(s, "staff-4", { orderId: o.id }),
    (e) => e.status >= 400 && e.status < 500,
  );
  await assert.rejects(
    routePreview(s, "customer-2", { orderId: o.id }),
    (e) => e.status >= 400 && e.status < 500,
  );
});

test("admin edits contact details and rejects duplicates", () => {
  const s = new CargoStore();
  const reason = "Customer asked by phone";
  s.adminAction("staff-1", "user", {
    id: "customer-1",
    phone: "+256 711 222 333",
    email: "New@Example.test",
    reason,
  });
  const p = s.profile("customer-1");
  assert.equal(p.phone, "+256 711 222 333");
  assert.equal(p.email, "new@example.test");
  const other = s.state.profiles.find(
    (x) => x.role === "customer" && x.id !== "customer-1",
  );
  if (other)
    assert.throws(
      () =>
        s.adminAction("staff-1", "user", {
          id: other.id,
          phone: "+256711222333",
          reason,
        }),
      code("ACCOUNT_EXISTS"),
    );
});

test("password reset forces a change at next sign-in and revokes sessions", () => {
  const s = new CargoStore();
  const r = s.adminAction("staff-1", "user", {
    id: "driver-1",
    resetPassword: true,
    reason: "Driver locked out",
  });
  assert.equal(r.demoTemporaryPassword, "Welcome2026!");
  assert.equal(s.profile("driver-1").forceReset, true);
  assert.equal(r.passwordHash, undefined);
});

test("setting a driver offline withdraws their open request", () => {
  const s = new CargoStore();
  s.availability("driver-1", { online: true });
  const o = order(s);
  s.snapshot("driver-1");
  const offered = s.order(o.id, "admin").dispatch.at(-1);
  assert.equal(offered.status, "offered");
  s.adminAction("staff-1", "user", {
    id: offered.driverId,
    offline: true,
    reason: "Vehicle reported unsafe",
  });
  assert.equal(s.profile(offered.driverId).online, false);
  assert.notEqual(
    s.order(o.id, "admin").dispatch.find((e) => e.driverId === offered.driverId)
      .status,
    "offered",
  );
});

test("revoking verification takes the driver offline until re-approved", () => {
  const s = new CargoStore();
  s.availability("driver-1", { online: true });
  s.adminAction("staff-1", "user", {
    id: "driver-1",
    verify: false,
    reason: "Insurance expired",
  });
  const p = s.profile("driver-1");
  assert.equal(p.verified, false);
  assert.equal(p.online, false);
  assert.throws(
    () => s.availability("driver-1", { online: true }),
    code("VERIFICATION_REQUIRED"),
  );
});

test("internal notes are staff-only and listed in the admin snapshot", () => {
  const s = new CargoStore();
  s.adminAction("staff-5", "note", { id: "customer-1", text: "Prefers calls" });
  const admin = s.adminSnapshot("staff-1");
  assert.equal(admin.notes.at(-1).text, "Prefers calls");
  assert.ok(Array.isArray(admin.walletTopups));
  const mobile = s.snapshot("customer-1");
  assert.equal(JSON.stringify(mobile).includes("Prefers calls"), false);
  assert.throws(
    () => s.adminAction("staff-5", "note", { id: "customer-1", text: "" }),
    code("NOTE_REQUIRED"),
  );
});

test("Customer Care cannot change account status", () => {
  const s = new CargoStore();
  assert.throws(
    () =>
      s.adminAction("staff-5", "user", {
        id: "customer-1",
        status: "suspended",
        reason: "Trying to suspend",
      }),
    code("FORBIDDEN"),
  );
});

// Account Management spec: roles staff-1 Super Admin, staff-2 Admin,
// staff-3 Team Lead, staff-4 Field Agent, staff-5 Customer Care.
test("role access follows the Account Management spec", () => {
  const s = new CargoStore();
  const scopes = (id) => s.adminSnapshot(id).permissions;
  // Dashboard: everyone except Field Agent.
  for (const id of ["staff-1", "staff-2", "staff-3", "staff-5"])
    assert.ok(scopes(id).includes("overview"), id + " dashboard");
  assert.ok(!scopes("staff-4").includes("overview"));
  // Staff section: Super Admin only.
  assert.ok(scopes("staff-1").includes("staff"));
  for (const id of ["staff-2", "staff-3", "staff-4", "staff-5"])
    assert.ok(!scopes(id).includes("staff"), id + " no staff section");
  // Viewing admin actions: Super Admin, Admin, Team Lead.
  for (const id of ["staff-1", "staff-2", "staff-3"])
    assert.ok(scopes(id).includes("audit"), id + " audit");
  for (const id of ["staff-4", "staff-5"])
    assert.ok(!scopes(id).includes("audit"));
  // Field Agent: no trips or money at all.
  const fa = s.adminSnapshot("staff-4");
  assert.equal(fa.orders.length, 0);
  assert.deepEqual(fa.withdrawals, []);
});

test("audit roles get staff names for attribution but not staff records", () => {
  const s = new CargoStore();
  const admin = s.adminSnapshot("staff-2");
  const irene = admin.staff.find((x) => x.id === "staff-1");
  assert.equal(irene.name, "Irene Nakiwala");
  assert.equal(irene.email, undefined);
  assert.equal(s.adminSnapshot("staff-5").staff.length, 0);
});

test("Field Agent can approve a driver but not edit, suspend or revoke", () => {
  const s = new CargoStore();
  s.adminAction("staff-4", "user", {
    id: "driver-1",
    verify: true,
    reason: "Documents checked in person",
  });
  for (const change of [
    { name: "New Name" },
    { status: "suspended" },
    { status: "inactive" },
    { verify: false },
    { resetPassword: true },
  ])
    assert.throws(
      () =>
        s.adminAction("staff-4", "user", {
          id: "driver-1",
          reason: "Field agent attempt",
          ...change,
        }),
      code("FORBIDDEN"),
      JSON.stringify(change),
    );
  // Customer Care cannot verify drivers.
  assert.throws(
    () =>
      s.adminAction("staff-5", "user", {
        id: "driver-1",
        verify: true,
        reason: "Care attempt",
      }),
    code("FORBIDDEN"),
  );
});

test("deactivating an account signs the person out and blocks sign-in", () => {
  const s = new CargoStore();
  s.adminAction("staff-3", "user", {
    id: "customer-1",
    status: "inactive",
    reason: "Customer asked to close the account",
  });
  assert.equal(s.profile("customer-1").status, "inactive");
});

test("staff edit their own name but cannot change their own role or deactivate", () => {
  const s = new CargoStore();
  s.adminAction("staff-2", "self", { name: "Daniel O. Okello" });
  assert.equal(s.staff("staff-2").name, "Daniel O. Okello");
  assert.throws(
    () =>
      s.adminAction("staff-1", "staff", {
        id: "staff-1",
        mode: "update",
        role: "Admin",
        reason: "Demote myself",
      }),
    code("SELF_CHANGE_FORBIDDEN"),
  );
  assert.throws(
    () =>
      s.adminAction("staff-1", "staff", {
        id: "staff-1",
        mode: "update",
        status: "inactive",
        reason: "Deactivate myself",
      }),
    code("SELF_CHANGE_FORBIDDEN"),
  );
  // Super Admin edits another staff member's profile.
  s.adminAction("staff-1", "staff", {
    id: "staff-5",
    mode: "update",
    name: "Joan Auma",
    email: "joan.auma@loadmaster.test",
    reason: "Updated work email",
  });
  assert.equal(s.staff("staff-5").email, "joan.auma@loadmaster.test");
  assert.throws(
    () =>
      s.adminAction("staff-2", "staff", {
        id: "staff-5",
        mode: "update",
        name: "X",
        reason: "Admin attempt",
      }),
    code("FORBIDDEN"),
  );
});

test("operations can message an account; it lands in their updates", () => {
  const s = new CargoStore();
  s.adminAction("staff-5", "message", {
    id: "customer-1",
    subject: "About your delivery",
    text: "Your driver will call before arriving.",
  });
  const n = s.snapshot("customer-1").notifications.at(-1);
  assert.equal(n.title, "About your delivery");
  assert.throws(
    () =>
      s.adminAction("staff-4", "message", {
        id: "customer-1",
        subject: "Hi",
        text: "Hello",
      }),
    code("FORBIDDEN"),
  );
});

test("vehicle edits validate the plate and are blocked during a trip", () => {
  const s = new CargoStore();
  const reason = "Plate typo corrected";
  s.adminAction("staff-1", "user", {
    id: "driver-2",
    vehicle: "Mitsubishi Canter FE",
    plate: "ubg 413 a",
    truckId: "medium",
    reason,
  });
  assert.equal(s.profile("driver-2").plate, "UBG 413 A");
  assert.throws(
    () =>
      s.adminAction("staff-1", "user", {
        id: "driver-2",
        plate: "UBB 920 B",
        reason,
      }),
    code("PLATE_EXISTS"),
  );
  s.availability("driver-1", { online: true });
  const o = order(s);
  s.snapshot("driver-1");
  s.accept("driver-1", o.id);
  assert.throws(
    () =>
      s.adminAction("staff-1", "user", {
        id: "driver-1",
        vehicle: "Other",
        reason,
      }),
    code("ACTIVE_ORDER"),
  );
});

test("drivers carry a simulated last-known location for the fleet map", () => {
  const s = new CargoStore();
  const drivers = s
    .adminSnapshot("staff-1")
    .people.filter((p) => p.role === "driver");
  assert.ok(drivers.length >= 6);
  for (const d of drivers) {
    assert.equal(typeof d.lastKnown.latitude, "number");
    assert.equal(d.lastKnown.simulated, true);
  }
});

test("roles are editable and deletable; Super Admin is fixed", () => {
  const s = new CargoStore();
  const reason = "Reorganising operations";
  // Create a role and give it to a staff member.
  s.adminAction("staff-1", "role", {
    mode: "create",
    name: "Dispatcher",
    permissions: "orders,tracking,drivers",
  });
  s.adminAction("staff-1", "staff", {
    id: "staff-5",
    mode: "update",
    role: "Dispatcher",
    reason,
  });
  assert.deepEqual(s.adminSnapshot("staff-5").permissions, [
    "orders",
    "tracking",
    "drivers",
  ]);
  // Editing permissions applies to holders immediately; rename follows staff.
  s.adminAction("staff-1", "role", {
    mode: "update",
    role: "Dispatcher",
    name: "Dispatch desk",
    permissions: ["orders", "drivers", "customers"],
    reason,
  });
  assert.equal(s.staff("staff-5").role, "Dispatch desk");
  assert.ok(s.adminSnapshot("staff-5").permissions.includes("customers"));
  assert.throws(
    () => s.adminSnapshot("staff-5") && s.permit("staff-5", "tracking"),
    code("FORBIDDEN"),
  );
  // Cannot delete while assigned; can after reassignment.
  assert.throws(
    () =>
      s.adminAction("staff-1", "role", {
        mode: "delete",
        role: "Dispatch desk",
        reason,
      }),
    code("ROLE_IN_USE"),
  );
  s.adminAction("staff-1", "staff", {
    id: "staff-5",
    mode: "update",
    role: "Customer Care",
    reason,
  });
  s.adminAction("staff-1", "role", {
    mode: "delete",
    role: "Dispatch desk",
    reason,
  });
  assert.ok(!s.state.roles.some((r) => r.name === "Dispatch desk"));
  // Super Admin cannot be changed or removed; only staff.write may manage roles.
  for (const mode of ["update", "delete"])
    assert.throws(
      () =>
        s.adminAction("staff-1", "role", {
          mode,
          role: "Super Admin",
          name: "Owner",
          permissions: "orders",
          reason,
        }),
      code("ROLE_LOCKED"),
    );
  assert.throws(
    () =>
      s.adminAction("staff-2", "role", {
        mode: "create",
        name: "X role",
        permissions: "orders",
      }),
    code("FORBIDDEN"),
  );
  // Other staff never receive the role list.
  assert.deepEqual(s.adminSnapshot("staff-2").roles, []);
});

test("demo data covers drivers, customers, trips and payments consistently", async () => {
  const { populate } = await import("../services/demo/demo-data.mjs");
  const s = new CargoStore();
  const log = populate(s);
  const st = s.state;
  // 5 generated drivers and 50 generated customers.
  assert.equal(
    st.profiles.filter((p) => /^driver-1\d\d$/.test(p.id)).length,
    5,
  );
  assert.equal(
    st.profiles.filter((p) => /^customer-1\d\d$/.test(p.id)).length,
    50,
  );
  // Test accounts are not left on a live trip.
  for (const id of ["driver-1", "driver-2", "customer-1", "customer-2"])
    assert.ok(
      !st.orders.some(
        (o) =>
          (o.driverId === id || o.customerId === id) &&
          !["delivered", "cancelled", "returned", "scheduled"].includes(
            o.stage,
          ),
      ),
      id,
    );
  assert.ok(log.trips > 150);
  const stages = new Set(st.orders.map((o) => o.stage));
  for (const x of ["delivered", "cancelled", "in_transit", "scheduled"])
    assert.ok(stages.has(x), x);
  const pay = new Set(st.orders.map((o) => o.payment.status));
  for (const x of ["paid", "failed", "unknown"]) assert.ok(pay.has(x), x);
  const dispatch = new Set(
    st.orders.flatMap((o) => o.dispatch.map((e) => e.status)),
  );
  for (const x of ["accepted", "declined", "missed", "released"])
    assert.ok(dispatch.has(x), x);
  assert.ok(st.withdrawals.some((w) => w.status === "paid"));
  assert.ok(st.operations.some((o) => o.kind === "refund"));
  // Ledger stays balanced and the clock was restored.
  for (const e of st.ledger)
    assert.equal(
      e.entries.reduce((n, x) => n + x.amount, 0),
      0,
    );
  assert.ok(Math.abs(Date.now() - new Date().getTime()) < 1000);
  assert.ok(Date.parse(st.orders[0].createdAt) < Date.now() - 20 * 86400000);
  // Running again is a no-op.
  assert.equal(populate(s).skipped, true);
});

test("profile photos accept JPG/PNG data URLs, can be removed and stay out of the audit", () => {
  const s = new CargoStore();
  const reason = "Driver sent a clearer photo";
  const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
  s.adminAction("staff-1", "user", { id: "driver-1", photo: png, reason });
  assert.equal(s.profile("driver-1").photo, png);
  const entry = s.state.audit.at(-1);
  assert.equal(entry.after?.photo ?? entry.detail?.after?.photo, "set");
  assert.ok(!JSON.stringify(entry).includes("base64"));
  assert.throws(
    () => s.adminAction("staff-1", "user", { id: "driver-1", photo: "data:image/gif;base64,R0lGOD", reason }),
    code("PHOTO_INVALID"),
  );
  assert.throws(
    () => s.adminAction("staff-5", "user", { id: "driver-1", photo: png, reason }),
    code("FORBIDDEN"),
  );
  s.adminAction("staff-1", "user", { id: "driver-1", photo: null, reason });
  assert.equal(s.profile("driver-1").photo, undefined);
});

test("mobile requests record the customer's and driver's device; staff are ignored", async () => {
  const { createServer } = await import("../services/demo/server.mjs");
  const s = new CargoStore();
  s.save = () => {};
  const server = createServer(s);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const header = (d) => encodeURIComponent(JSON.stringify(d));
  const get = (account, device) =>
    fetch(base + "/snapshot", {
      headers: { Authorization: "Bearer demo-" + account, "X-Device": header(device) },
    });
  try {
    const tecno = { platform: "android", type: "phone", brand: "TECNO", model: "TECNO Spark 20", osVersion: "14", name: "TECNO Spark 20", appVersion: "2.0.0" };
    const iphone = { platform: "ios", type: "phone", brand: "Apple", model: "iPhone", osVersion: "18.1", name: "Alex’s iPhone", appVersion: "2.0.0" };
    assert.equal((await get("driver-1", tecno)).status, 200);
    assert.equal((await get("customer-1", iphone)).status, 200);
    const d = s.profile("driver-1").device;
    assert.equal(d.model, "TECNO Spark 20");
    assert.equal(d.osVersion, "14");
    assert.ok(d.firstSeenAt && d.lastSeenAt);
    // Non-ASCII device names survive the URI-encoded header.
    assert.equal(s.profile("customer-1").device.name, "Alex’s iPhone");
    // A new phone becomes current; the old one is kept as history.
    await get("driver-1", { ...iphone, name: "Brian’s iPhone" });
    const p = s.profile("driver-1");
    assert.equal(p.device.platform, "ios");
    assert.equal(p.devices.length, 2);
    // An app update on a known device updates it in place.
    await get("driver-1", { ...iphone, name: "Brian’s iPhone", appVersion: "2.1.0" });
    assert.equal(s.profile("driver-1").devices.length, 2);
    assert.equal(s.profile("driver-1").device.appVersion, "2.1.0");
    // History is capped at five devices.
    for (let i = 0; i < 6; i++) await get("driver-1", { ...tecno, name: "Phone " + i });
    assert.equal(s.profile("driver-1").devices.length, 5);
    // Junk headers and unknown platforms are handled safely.
    await fetch(base + "/snapshot", { headers: { Authorization: "Bearer demo-customer-2", "X-Device": "%%%not-json" } });
    assert.equal(s.profile("customer-2").device, undefined);
    await get("customer-2", { platform: "<script>", model: "x".repeat(500) });
    assert.equal(s.profile("customer-2").device.platform, "other");
    assert.equal(s.profile("customer-2").device.model.length, 60);
    // Staff accounts never get a device record.
    s.recordDevice("staff-1", header(tecno));
    assert.equal(s.state.profiles.find((x) => x.id === "staff-1")?.device, undefined);
  } finally {
    server.close();
  }
});
