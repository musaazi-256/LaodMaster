// Realistic demo data: 5 extra drivers and 50 customers with 30 days of
// trips that exercise every feature (declines, misses, releases, cancellations,
// card/mobile money/cash/wallet payments with failures and retries, refunds,
// ratings, issues, payouts, rewards, cash remittance, documents in review,
// suspended and deactivated accounts) plus trips in progress right now.
//
// Everything is created through the store's own actions so balances, the
// ledger, audit trail and notifications stay consistent. A simulated clock
// spreads the activity over the past month. Synthetic data only.
import { randomUUID } from "node:crypto";
import { trucks, places } from "./model.mjs";

const first = [
  "Brian",
  "Grace",
  "Peter",
  "Moses",
  "Ruth",
  "Joseph",
  "Sarah",
  "Daniel",
  "Esther",
  "Isaac",
  "Agnes",
  "Samuel",
  "Joan",
  "Ronald",
  "Patience",
  "Ivan",
  "Mercy",
  "Henry",
  "Lydia",
  "Paul",
  "Doreen",
  "Emmanuel",
  "Florence",
  "Godfrey",
  "Harriet",
  "Julius",
  "Prossy",
  "Kenneth",
  "Winnie",
  "Allan",
  "Sylvia",
  "Denis",
  "Annet",
  "Robert",
  "Teddy",
  "Collins",
  "Brenda",
  "Fred",
  "Caroline",
  "Simon",
];
const last = [
  "Okello",
  "Nakato",
  "Mugisha",
  "Achieng",
  "Kato",
  "Nambasa",
  "Wasswa",
  "Namubiru",
  "Ssemanda",
  "Atim",
  "Tumusiime",
  "Nalwoga",
  "Opio",
  "Babirye",
  "Kizza",
  "Namugga",
  "Ochieng",
  "Kyomuhendo",
  "Lubega",
  "Akello",
  "Mutebi",
  "Nansubuga",
  "Byaruhanga",
  "Auma",
  "Ssali",
  "Nabirye",
  "Kiggundu",
  "Adong",
];
const models = {
  small: ["Toyota Dyna", "Nissan Cabstar", "Isuzu Elf", "Mazda Titan"],
  medium: ["Mitsubishi Canter", "Fuso Canter", "Isuzu NPR", "Toyota Dyna 300"],
  large: ["Isuzu Forward", "Isuzu FVR", "Hino 500", "Mitsubishi Fighter"],
};
const declineReasons = [
  "Too far from me",
  "Truck is being serviced",
  "Load too heavy for my route",
  "Finishing a personal errand",
  "Fuel is low",
];
const reviews = [
  "On time and careful with the boxes.",
  "Friendly driver, quick offloading.",
  "Arrived a bit late but handled everything well.",
  "Great communication throughout.",
  "Cargo arrived safely.",
  "",
];
const issues = [
  "One carton was damp on arrival.",
  "Driver could not find the loading gate.",
  "Charged for a helper we did not use.",
  "Delivery took much longer than estimated.",
];

/** Small deterministic PRNG so every reset produces the same demo. */
function rng(seed) {
  let t = seed >>> 0;
  const next = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (a, b) => a + Math.floor(next() * (b - a + 1)),
    pick: (list) => list[Math.floor(next() * list.length)],
    chance: (p) => next() < p,
  };
}

/** Swap the global Date for one that reads a controllable clock. */
function clock(start) {
  const Real = Date;
  let at = start;
  class Simulated extends Real {
    constructor(...args) {
      if (args.length) super(...args);
      else super(at);
    }
    static now() {
      return at;
    }
  }
  globalThis.Date = Simulated;
  return {
    set: (t) => (at = t),
    add: (minutes) => (at += minutes * 60000),
    get: () => at,
    restore: () => (globalThis.Date = Real),
  };
}

const phone = (n) =>
  "+256 7" +
  String(10 + (n % 80)).padStart(2, "0") +
  " " +
  String(100 + ((n * 37) % 900)) +
  " " +
  String(100 + ((n * 91) % 900));

export function populate(store, { seed = 2026, days = 30 } = {}) {
  const s = store.state;
  if (s.demoData) return { skipped: true };
  const r = rng(seed);
  const saved = store.save;
  store.save = () => {};
  const startReal = Date.now();
  const c = clock(startReal - (days + 120) * 86400000);
  const log = { trips: 0, failed: 0, errors: {} };
  const attempt = (label, fn) => {
    try {
      return fn();
    } catch (e) {
      log.failed++;
      log.errors[label + ":" + (e.code || e.message)] =
        (log.errors[label + ":" + (e.code || e.message)] || 0) + 1;
      return undefined;
    }
  };
  try {
    // ---- Accounts --------------------------------------------------------
    const docNames = [
      "Driver licence",
      "Identity document",
      "Vehicle registration",
      "Third-party insurance",
    ];
    const used = new Set(s.profiles.map((p) => p.phone));
    const newPhone = (n) => {
      let p = phone(n);
      while (used.has(p)) p = phone(++n + 977);
      used.add(p);
      return p;
    };
    const drivers = [];
    for (let i = 0; i < 5; i++) {
      const id = "driver-" + (101 + i);
      const name =
        first[(i * 7 + 3) % first.length] +
        " " +
        last[(i * 5 + 1) % last.length];
      const truckId = ["small", "small", "medium", "medium", "large"][i % 5];
      // 3 approved & active, 1 in verification, 1 suspended.
      const kind = i < 3 ? "active" : i === 3 ? "review" : "suspended";
      c.set(startReal - r.int(40, 180) * 86400000);
      const createdAt = new Date().toISOString();
      const verified = kind !== "review";
      const plate =
        "UB" +
        String.fromCharCode(65 + (i % 26)) +
        " " +
        String(100 + ((i * 53) % 900)) +
        " " +
        String.fromCharCode(65 + ((i * 3) % 26));
      const docStatus = (j) =>
        verified
          ? "approved"
          : [
              ["pending", "pending", "approved", "approved"],
              ["rejected", "approved", "pending", "approved"],
              ["approved", "approved", "approved", "pending"],
            ][i % 3][j];
      const p = {
        id,
        role: "driver",
        name,
        phone: newPhone(300 + i),
        email:
          name.toLowerCase().replace(/\s+/g, ".") + (i + 1) + "@example.test",
        verified,
        online: false,
        truckId,
        plate,
        vehicle: r.pick(models[truckId]),
        vehicleStatus: verified ? "approved" : "pending",
        declined: [],
        status:
          kind === "suspended"
            ? "suspended"
            : kind === "inactive"
              ? "inactive"
              : "active",
        phoneVerified: true,
        createdAt,
        pairCode: String(3001 + i),
        preferences: { notifications: true, hideAmounts: false },
        paymentMethods: [],
        documents: docNames
          .map((n, j) => ({
            id: "DOC-" + randomUUID().slice(0, 8).toUpperCase(),
            name: n,
            status: docStatus(j),
            fileName: n.toLowerCase().replace(/\s+/g, "-") + ".jpg",
            reason:
              docStatus(j) === "rejected"
                ? "Photo is blurry; please retake in daylight."
                : undefined,
            createdAt,
            demo: true,
          }))
          .filter((d, j) => verified || i % 3 !== 2 || j < 3),
      };
      store.state.profiles.push(p);
      s.accounts[id] = 0;
      drivers.push({ p, kind });
    }
    const customers = [];
    for (let i = 0; i < 50; i++) {
      const id = "customer-" + (101 + i);
      const name =
        first[(i * 11 + 5) % first.length] +
        " " +
        last[(i * 3 + 7) % last.length];
      c.set(startReal - r.int(35, 200) * 86400000);
      const p = {
        id,
        role: "customer",
        name,
        phone: newPhone(700 + i),
        email: name.toLowerCase().replace(/\s+/g, ".") + "@example.test",
        status: i === 48 ? "suspended" : i === 49 ? "inactive" : "active",
        phoneVerified: true,
        createdAt: new Date().toISOString(),
        preferences: { notifications: true, hideAmounts: false },
        paymentMethods: [
          {
            id: "method-mtn",
            kind: i % 3 === 0 ? "airtel" : "mtn",
            last4: String(1000 + ((i * 137) % 9000)),
            label: "Mobile Money",
            isDefault: true,
          },
          ...(i % 4 === 0
            ? [
                {
                  id: "method-card",
                  kind: "card",
                  last4: "4242",
                  label: "Visa",
                  isDefault: false,
                },
              ]
            : []),
        ],
      };
      store.state.profiles.push(p);
      s.accounts[id] = 0;
      customers.push(p);
    }
    const activeCustomers = [
      ...customers.filter((p) => p.status === "active"),
      ...s.profiles.filter((p) => ["customer-1", "customer-2"].includes(p.id)),
    ];
    // New active drivers plus the approved built-in demo drivers.
    const workers = [
      ...drivers.filter((d) => d.kind === "active").map((d) => d.p),
      ...s.profiles.filter(
        (p) =>
          p.role === "driver" &&
          p.verified &&
          p.status === "active" &&
          !drivers.some((d) => d.p === p),
      ),
    ];
    // Accounts people sign in with for testing stay free of live trips.
    const reserved = ["driver-1", "driver-2", "customer-1", "customer-2"];
    const capacity = (id) => trucks.findIndex((t) => t.id === id);
    const online = (p, on) => {
      p.online = on;
    };
    const tryOffer = (p, o) => {
      online(p, true);
      const got = store.currentOffer(p);
      return got && got.o.id === o.id ? got.e : null;
    };

    // ---- Historical trips -------------------------------------------------
    const methodMix = [
      "mtn",
      "mtn",
      "mtn",
      "airtel",
      "airtel",
      "card",
      "cash",
      "cash",
      "wallet",
    ];
    const tripsPerDay = 10;
    const base = startReal - days * 86400000;
    let n = 0;
    const plans = [];
    for (let d = 0; d < days; d++)
      for (let k = 0; k < tripsPerDay + r.int(-2, 3); k++)
        plans.push(base + d * 86400000 + r.int(6 * 60, 19 * 60) * 60000);
    plans.sort((a, b) => a - b);
    for (const startAt of plans) {
      c.set(startAt);
      n++;
      const customer = r.pick(activeCustomers);
      const truck = r.pick(["small", "small", "medium", "medium", "large"]);
      const fit = workers.filter((p) => capacity(p.truckId) >= capacity(truck));
      const driver = r.pick(fit);
      const [from, to] = (() => {
        const a = r.pick(places);
        let b = r.pick(places);
        while (b.id === a.id) b = r.pick(places);
        return [a, b];
      })();
      const method = r.pick(methodMix);
      if (method === "wallet")
        attempt("topup", () =>
          store.mobile(customer.id, "wallet", {
            key: "seed-top-" + n,
            amount: r.pick([100000, 150000, 200000]),
            method: "mtn",
            outcome: "success",
          }),
        );
      const quote = attempt("quote", () =>
        store.quote(customer.id, {
          pickupId: from.id,
          destinationId: to.id,
          truckId: truck,
          loading: r.int(0, 2),
          offloading: r.int(0, 1),
        }),
      );
      if (!quote) continue;
      const o = attempt("create", () =>
        store.create(
          customer.id,
          { quoteId: quote.id, method },
          "seed-order-" + n,
        ),
      );
      if (!o) continue;
      log.trips++;
      const outcome = r.next();
      // Customer cancels while searching (10%).
      if (outcome < 0.1) {
        c.add(r.int(2, 9));
        attempt("cancel", () =>
          store.cancel(customer.id, o.id, {
            reason: r.pick([
              "Plans changed",
              "Found another truck",
              "Wrong pickup time",
            ]),
          }),
        );
        continue;
      }
      // Some drivers decline or miss before someone accepts.
      const others = fit.filter((p) => p !== driver);
      for (let k = 0; k < (r.chance(0.35) ? r.int(1, 2) : 0); k++) {
        const other = r.pick(others);
        c.add(1);
        const e = tryOffer(other, o);
        if (!e) {
          online(other, false);
          continue;
        }
        if (r.chance(0.6)) {
          c.add(r.int(0, 1) / 2);
          attempt("decline", () =>
            store.decline(other.id, o.id, { reason: r.pick(declineReasons) }),
          );
        } else {
          c.add(1);
          store.expireOffers();
        }
        online(other, false);
      }
      c.add(r.int(1, 4));
      online(driver, true);
      if (!attempt("accept", () => store.accept(driver.id, o.id))) {
        online(driver, false);
        attempt("cleanup", () =>
          store.cancel(customer.id, o.id, { reason: "No driver available" }),
        );
        continue;
      }
      // Driver releases before pickup (3%), then a second driver takes it.
      let carrier = driver;
      if (outcome > 0.97) {
        c.add(r.int(3, 10));
        attempt("release", () =>
          store.cancel(driver.id, o.id, { reason: "Truck broke down" }),
        );
        online(driver, false);
        carrier = r.pick(fit.filter((p) => p !== driver));
        c.add(r.int(2, 6));
        online(carrier, true);
        if (!attempt("accept2", () => store.accept(carrier.id, o.id))) {
          online(carrier, false);
          attempt("cleanup", () =>
            store.cancel(customer.id, o.id, { reason: "No driver available" }),
          );
          continue;
        }
      }
      // Customer cancels after a driver was assigned (4%).
      if (outcome >= 0.1 && outcome < 0.14) {
        c.add(r.int(3, 12));
        attempt("cancel2", () =>
          store.cancel(customer.id, o.id, { reason: "Driver is too far away" }),
        );
        online(carrier, false);
        continue;
      }
      for (const [stage, mins] of [
        ["to_pickup", [1, 3]],
        ["at_pickup", [10, 35]],
        ["loading", [3, 8]],
        ["in_transit", [10, 25]],
        ["at_destination", [15, 70]],
        ["offloading", [2, 6]],
        ["delivered", [8, 25]],
      ]) {
        c.add(r.int(...mins));
        attempt("advance", () =>
          store.advance(carrier.id, o.id, { stage, confirmed: true }),
        );
      }
      online(carrier, false);
      if (store.order(o.id, "admin").stage !== "delivered") continue;
      // Payment.
      c.add(r.int(2, 30));
      if (method === "cash") {
        attempt("cash", () =>
          store.cargoAction(carrier.id, o.id, {
            action: "cash-received",
            amount: o.quote.total,
          }),
        );
        if (r.chance(0.88)) {
          c.add(r.int(5, 120));
          attempt("cash-confirm", () =>
            store.payment(customer.id, o.id, { action: "confirm-cash" }),
          );
        }
      } else {
        const roll = r.next();
        const scenario =
          roll < 0.8
            ? "success"
            : roll < 0.87
              ? "declined"
              : roll < 0.92
                ? "insufficient"
                : roll < 0.96
                  ? "timeout"
                  : "delayed";
        attempt("pay", () =>
          store.payment(customer.id, o.id, {
            action: "approve",
            scenario,
            method,
          }),
        );
        if (scenario === "declined" && r.chance(0.75)) {
          c.add(r.int(3, 40));
          attempt("retry", () =>
            store.payment(customer.id, o.id, {
              action: "retry",
              method: "airtel",
            }),
          );
          attempt("retry-pay", () =>
            store.payment(customer.id, o.id, {
              action: "approve",
              scenario: "success",
              method: "airtel",
            }),
          );
        }
        if (
          scenario === "timeout" ||
          (scenario === "delayed" && r.chance(0.5))
        ) {
          c.add(r.int(5, 60));
          attempt("resolve", () =>
            store.payment(customer.id, o.id, { action: "resolve" }),
          );
        }
      }
      // Rating, issues, refunds.
      if (r.chance(0.65)) {
        c.add(r.int(5, 240));
        attempt("rating", () =>
          store.mobile(customer.id, "rating", {
            orderId: o.id,
            rating: r.pick([5, 5, 5, 4, 4, 4, 3, 2]),
            review: r.pick(reviews),
          }),
        );
      }
      if (r.chance(0.05)) {
        c.add(r.int(10, 300));
        attempt("issue", () =>
          store.issue(customer.id, o.id, { message: r.pick(issues) }),
        );
      }
      const paid = store.order(o.id, "admin");
      if (
        paid.payment.status === "paid" &&
        paid.method !== "cash" &&
        r.chance(0.05)
      ) {
        c.add(r.int(60, 1440));
        attempt("refund", () =>
          store.admin(
            o.id,
            {
              action: "refund",
              amount: Math.round(paid.quote.total * r.pick([0.2, 0.5, 1])),
              reason: "Goodwill refund after customer complaint",
              key: "seed-refund-" + n,
              outcome: "success",
            },
            "staff-2",
          ),
        );
      }
      if (
        paid.method === "cash" &&
        paid.payment.status === "paid" &&
        r.chance(0.6)
      ) {
        c.add(r.int(60, 2880));
        attempt("remit", () =>
          store.adminCash("staff-2", {
            id: o.id,
            reason: "Mobile money remittance received REF" + n,
          }),
        );
      }
      if (paid.stage === "delivered" && r.chance(0.04)) {
        attempt("reward", () =>
          store.adminAction("staff-1", "reward", {
            mode: "create",
            account: customer.id,
            orderId: o.id,
            kind: r.pick(["cashback", "referral"]),
            amount: r.pick([2000, 5000, 10000]),
            reason: "Loyalty campaign",
          }),
        );
      }
      // Weekly payout requests from drivers with earnings.
      if (n % 23 === 0) {
        for (const p of workers.filter(() => r.chance(0.35))) {
          const w = attempt("withdrawal", () =>
            store.mobile(p.id, "withdrawal", {}),
          );
          if (!w) continue;
          c.add(r.int(30, 600));
          const roll = r.next();
          if (roll < 0.7) {
            attempt("payout", () => {
              store.adminAction("staff-2", "withdrawal", {
                id: w.id,
                status: "approved",
                reason: "Weekly settlement",
                outcome: "success",
              });
              return store.adminAction("staff-2", "withdrawal", {
                id: w.id,
                status: "pay",
                outcome: "success",
                key: "seed-payment-" + w.id,
                reference: "seed-provider-" + w.id,
                reason: "Finance confirmed weekly settlement",
              });
            });
          } else if (roll < 0.8)
            attempt("payout-reject", () =>
              store.adminAction("staff-2", "withdrawal", {
                id: w.id,
                status: "rejected",
                reason: "Bank details need confirming",
              }),
            );
        }
      }
    }

    // ---- Support, notes, messages ----------------------------------------
    for (const p of activeCustomers.filter(() => r.chance(0.25))) {
      c.set(startReal - r.int(1, days) * 86400000);
      attempt("ticket", () =>
        store.mobile(p.id, "ticket", {
          subject: r.pick([
            "Receipt not received",
            "Change my phone number",
            "Question about helper fees",
          ]),
          message: r.pick([
            "Please help me with this, thank you.",
            "I need this sorted before Friday.",
            "Can someone call me back?",
          ]),
        }),
      );
    }
    for (const { p } of drivers.filter((d) => d.kind === "suspended"))
      attempt("note", () =>
        store.adminAction("staff-3", "note", {
          id: p.id,
          text: "Suspended after repeated late arrivals; review in two weeks.",
        }),
      );

    // ---- Right now: trips in progress and drivers online -------------------
    c.set(startReal - 90 * 60000);
    const free = workers.filter((p) => !reserved.includes(p.id));
    const liveStages = ["to_pickup", "loading", "in_transit", "offloading"];
    const liveCustomers = activeCustomers.filter(
      (p) => !reserved.includes(p.id),
    );
    const order = [
      "to_pickup",
      "at_pickup",
      "loading",
      "in_transit",
      "at_destination",
      "offloading",
    ];
    for (const [k, target] of liveStages.entries()) {
      c.add(r.int(3, 8));
      const customer = liveCustomers[k % liveCustomers.length];
      const driver = free.splice(r.int(0, free.length - 1), 1)[0];
      const truck = ["small", "medium", "large"]
        .filter((t) => capacity(t) <= capacity(driver.truckId))
        .at(-1);
      const a = places[(k * 5) % places.length];
      const b = places[(k * 5 + 3) % places.length];
      const q = attempt("live-quote", () =>
        store.quote(customer.id, {
          pickupId: a.id,
          destinationId: b.id,
          truckId: truck,
        }),
      );
      if (!q) continue;
      const o = attempt("live-create", () =>
        store.create(
          customer.id,
          { quoteId: q.id, method: r.pick(["mtn", "cash", "airtel"]) },
          "seed-live-" + k,
        ),
      );
      if (!o) continue;
      online(driver, true);
      c.add(2);
      if (!attempt("live-accept", () => store.accept(driver.id, o.id)))
        continue;
      for (const stage of order.slice(0, order.indexOf(target) + 1)) {
        c.add(r.int(4, 12));
        attempt("live-advance", () =>
          store.advance(driver.id, o.id, { stage, confirmed: true }),
        );
      }
    }
    // Scheduled pickups for the coming days.
    for (let k = 0; k < 4; k++) {
      c.set(startReal);
      const customer = activeCustomers[(k * 7) % activeCustomers.length];
      const q = attempt("sched-quote", () =>
        store.quote(customer.id, {
          pickupId: places[k].id,
          destinationId: places[k + 4].id,
          truckId: "medium",
          scheduledAt: new Date(
            startReal + (k + 1) * 86400000 + 9 * 3600000,
          ).toISOString(),
        }),
      );
      if (q)
        attempt("sched-create", () =>
          store.create(
            customer.id,
            {
              quoteId: q.id,
              method: "mtn",
              scheduledAt: new Date(
                startReal + (k + 1) * 86400000 + 9 * 3600000,
              ).toISOString(),
            },
            "seed-sched-" + k,
          ),
        );
    }
    // Eight more free drivers online and waiting.
    for (const p of free.slice(0, 2)) online(p, true);
    // ---- Devices -------------------------------------------------------
    // What the mobile apps would have reported (X-Device). Android-heavy, as
    // in the Ugandan market; a few accounts have not opened the app yet.
    const androids = [
      ["TECNO", "TECNO Spark 20", "14"],
      ["TECNO", "TECNO Camon 30", "14"],
      ["Infinix", "Infinix Hot 40", "13"],
      ["Infinix", "Infinix Note 30", "13"],
      ["samsung", "Galaxy A15", "14"],
      ["samsung", "Galaxy A05s", "13"],
      ["itel", "itel A70", "13"],
      ["Xiaomi", "Redmi 13C", "13"],
    ];
    const apple = [
      ["iPhone", "18.1"],
      ["iPhone", "17.6"],
      ["iPad", "18.0"],
    ];
    for (const p of s.profiles.filter((x) =>
      ["customer", "driver"].includes(x.role),
    )) {
      if (p.role === "customer" && r.chance(0.08)) continue;
      const ios = r.chance(p.role === "driver" ? 0.1 : 0.22);
      const first = p.name.split(" ")[0];
      const base = ios
        ? (() => {
            const [model, os] = apple[r.int(0, apple.length - 1)];
            return {
              platform: "ios",
              type: model === "iPad" ? "tablet" : "phone",
              brand: "Apple",
              model,
              osVersion: os,
              name: first + "’s " + model,
            };
          })()
        : (() => {
            const [brand, model, os] = androids[r.int(0, androids.length - 1)];
            return {
              platform: "android",
              type: "phone",
              brand,
              model,
              osVersion: os,
              name: model,
            };
          })();
      const lastSeen = startReal - r.int(2, p.online ? 30 : 60 * 72) * 60000;
      const device = {
        key: [base.platform, base.brand, base.model, base.name].join("|"),
        ...base,
        appVersion: r.chance(0.8) ? "2.0.0" : "1.9.4",
        firstSeenAt: new Date(
          Math.min(
            Date.parse(p.createdAt || "") + 60000 || Infinity,
            lastSeen - 86400000,
          ),
        ).toISOString(),
        lastSeenAt: new Date(lastSeen).toISOString(),
      };
      p.devices = [device];
      // Some people changed phones: keep the old one as an earlier device.
      if (r.chance(0.12)) {
        const [brand, model, os] = androids[r.int(0, androids.length - 1)];
        p.devices.push({
          key: ["android", brand, model, model].join("|"),
          platform: "android",
          type: "phone",
          brand,
          model,
          osVersion: os,
          name: model,
          appVersion: "1.9.4",
          ...(() => {
            const oldLast = lastSeen - r.int(10, 60) * 86400000;
            return {
              firstSeenAt: new Date(
                oldLast - r.int(30, 120) * 86400000,
              ).toISOString(),
              lastSeenAt: new Date(oldLast).toISOString(),
            };
          })(),
        });
        device.firstSeenAt = new Date(
          Math.max(
            Date.parse(device.firstSeenAt),
            Date.parse(p.devices[1].lastSeenAt),
          ),
        ).toISOString();
      }
      p.device = p.devices[0];
    }
    c.set(startReal);
    s.demoData = {
      generatedAt: new Date(startReal).toISOString(),
      seed,
      ...log,
    };
  } finally {
    c.restore();
    store.save = saved;
  }
  store.save();
  return log;
}
