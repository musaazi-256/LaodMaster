export const METHODS = [
  "mtn",
  "airtel",
  "card",
  "cash",
  "flexipay",
  "external_wallet",
  "wallet",
];
import { randomUUID } from "node:crypto";
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import { dirname } from "node:path";
export class DomainError extends Error {
  constructor(code, message, status = 409) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
const fail = (ok, code, message, status) => {
  if (!ok) throw new DomainError(code, message, status);
};
const uid = (prefix) => `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
const now = () => new Date().toISOString();
// How long a driver has to answer a request before it counts as missed.
export const OFFER_SECONDS = Number(process.env.OFFER_SECONDS || 45);
// Outcomes that stop the same request being offered to that driver again.
const CLOSED_FOR_DRIVER = ["declined", "missed", "released"];
export const trucks = [
  {
    id: "small",
    name: "Pickup",
    capacity: "Up to 1 tonne",
    body: "Open bed · everyday cargo",
    maxKg: 1000,
    base: 22000,
    perKm: 2500,
  },
  {
    id: "medium",
    name: "Medium truck",
    capacity: "Up to 3 tonnes",
    body: "Covered · furniture & stock",
    maxKg: 3000,
    base: 40000,
    perKm: 4000,
  },
  {
    id: "large",
    name: "Large truck",
    capacity: "Up to 7 tonnes",
    body: "Covered · bulk cargo",
    maxKg: 7000,
    base: 70000,
    perKm: 6000,
  },
];
export const places = [
  {
    id: "ntinda",
    name: "Ntinda Shopping Centre",
    detail: "Ntinda · Kampala",
    latitude: 0.3546,
    longitude: 32.6135,
  },
  {
    id: "nakawa",
    name: "Nakawa Market",
    detail: "Nakawa · Kampala",
    latitude: 0.3328,
    longitude: 32.6114,
  },
  {
    id: "kololo",
    name: "Acacia Mall",
    detail: "Kisementi · Kololo",
    latitude: 0.3388,
    longitude: 32.5854,
  },
  {
    id: "city",
    name: "Kampala Road",
    detail: "City Centre · Kampala",
    latitude: 0.3148,
    longitude: 32.5801,
  },
  {
    id: "najjeera",
    name: "Najjeera Trading Centre",
    detail: "Najjeera · Wakiso",
    latitude: 0.3993,
    longitude: 32.6434,
  },
  {
    id: "namuwongo",
    name: "Namuwongo Industrial Area",
    detail: "Namuwongo · Kampala",
    latitude: 0.3024,
    longitude: 32.6118,
  },
  {
    id: "wandegeya",
    name: "Wandegeya Market",
    detail: "Wandegeya · Kampala",
    latitude: 0.3321,
    longitude: 32.5717,
  },
  {
    id: "kawempe",
    name: "Kawempe Trading Centre",
    detail: "Kawempe · Kampala",
    latitude: 0.3786,
    longitude: 32.5603,
  },
  {
    id: "bweyogerere",
    name: "Bweyogerere Industrial Park",
    detail: "Bweyogerere · Wakiso",
    latitude: 0.3611,
    longitude: 32.6721,
  },
  {
    id: "kireka",
    name: "Kireka Stores",
    detail: "Kireka · Wakiso",
    latitude: 0.3456,
    longitude: 32.6487,
  },
  {
    id: "kajjansi",
    name: "Kajjansi Depot",
    detail: "Kajjansi · Wakiso",
    latitude: 0.2134,
    longitude: 32.5497,
  },
  {
    id: "industrial",
    name: "Kampala Industrial Area",
    detail: "Industrial Area · Kampala",
    latitude: 0.3188,
    longitude: 32.6046,
  },
];
export const seed = () => ({
  version: 1,
  feeRate: 0.15,
  helperRate: 12000,
  profiles: [
    {
      id: "customer-1",
      role: "customer",
      name: "Alex Mukasa",
      phone: "+256 700 000 111",
      email: "alex@example.test",
    },
    {
      id: "customer-2",
      role: "customer",
      name: "Sarah Nakato",
      phone: "+256 700 000 112",
      email: "sarah@example.test",
    },
    {
      id: "driver-1",
      role: "driver",
      name: "Brian Kato",
      phone: "+256 700 000 222",
      email: "brian@example.test",
      verified: true,
      online: false,
      truckId: "large",
      plate: "UBB 920 B",
      vehicle: "Isuzu Forward",
      declined: [],
      documents: [],
    },
    {
      id: "driver-2",
      role: "driver",
      name: "Grace Nambasa",
      phone: "+256 700 000 223",
      email: "grace@example.test",
      verified: true,
      online: false,
      truckId: "medium",
      plate: "UBG 412 A",
      vehicle: "Mitsubishi Canter",
      declined: [],
      documents: [],
    },
    {
      id: "driver-3",
      role: "driver",
      name: "Peter Wasswa",
      phone: "+256 700 000 224",
      email: "peter.w@example.test",
      verified: true,
      online: false,
      truckId: "small",
      plate: "UBF 108 C",
      vehicle: "Toyota Dyna",
      declined: [],
      documents: [],
    },
    {
      id: "driver-4",
      role: "driver",
      name: "Moses Okello",
      phone: "+256 700 000 225",
      email: "moses@example.test",
      verified: true,
      online: false,
      truckId: "large",
      plate: "UBK 771 D",
      vehicle: "Isuzu FVR",
      declined: [],
      documents: [],
    },
    {
      id: "driver-5",
      role: "driver",
      name: "Ruth Achieng",
      phone: "+256 700 000 226",
      email: "ruth@example.test",
      verified: true,
      online: false,
      truckId: "medium",
      plate: "UBH 330 E",
      vehicle: "Fuso Canter",
      declined: [],
      documents: [],
    },
    {
      id: "driver-6",
      role: "driver",
      name: "Joseph Mugisha",
      phone: "+256 700 000 227",
      email: "joseph@example.test",
      verified: true,
      online: false,
      truckId: "small",
      plate: "UBJ 545 F",
      vehicle: "Nissan Cabstar",
      declined: [],
      documents: [],
    },
  ],
  offerSeconds: OFFER_SECONDS,
  orders: [],
  quotes: [],
  keys: {},
  audit: [],
  funding: 5000000,
});
export class Store {
  constructor(file) {
    this.file = file;
    this.state =
      file && existsSync(file)
        ? JSON.parse(readFileSync(file, "utf8"))
        : seed();
    this.state.offerSeconds ??= OFFER_SECONDS;
    for (const o of this.state.orders) o.dispatch ??= [];
  }
  save() {
    if (this.file) {
      mkdirSync(dirname(this.file), { recursive: true });
      const tmp = this.file + ".tmp";
      writeFileSync(tmp, JSON.stringify(this.state, null, 2));
      renameSync(tmp, this.file);
    }
  }
  record(actor, action, target, detail) {
    this.state.audit.push({
      id: uid("EVT"),
      actor,
      action,
      target,
      detail,
      at: now(),
    });
    this.save();
  }
  profile(id) {
    const p = this.state.profiles.find((x) => x.id === id);
    fail(p, "SESSION_INVALID", "Choose a valid demo account.", 401);
    return p;
  }
  order(id, actor) {
    const o = this.state.orders.find((x) => x.id === id);
    fail(o, "ORDER_NOT_FOUND", "This order could not be found.", 404);
    if (actor !== "admin") {
      const p = this.profile(actor);
      fail(
        o.customerId === actor ||
          o.driverId === actor ||
          (p.role === "driver" && o.stage === "searching"),
        "FORBIDDEN",
        "This order belongs to another account.",
        403,
      );
    }
    return o;
  }
  update(o, stage, note = "") {
    o.stage = stage;
    o.updatedAt = now();
    o.timeline.push({ stage, at: o.updatedAt, note });
    if (stage !== "searching")
      for (const e of o.dispatch || [])
        if (e.status === "offered")
          this.close(
            e,
            "withdrawn",
            stage === "cancelled"
              ? "Customer cancelled the order"
              : "Assigned to another driver",
          );
  }
  close(entry, status, reason = "") {
    entry.status = status;
    entry.respondedAt = now();
    if (reason) entry.reason = String(reason).slice(0, 200);
  }
  dispatchEntry(o, driverId) {
    return (o.dispatch ||= []).findLast((e) => e.driverId === driverId);
  }
  busy(driverId) {
    return this.state.orders.some(
      (x) =>
        x.driverId === driverId &&
        !["delivered", "cancelled", "returned"].includes(x.stage),
    );
  }
  fits(p, o) {
    return (
      trucks.find((t) => t.id === p.truckId)?.maxKg >=
      trucks.find((t) => t.id === o.quote.truckId)?.maxKg
    );
  }
  // Whether this searching order may be offered to driver p right now.
  offerable(p, o) {
    const last = this.dispatchEntry(o, p.id);
    return (
      o.stage === "searching" &&
      !p.declined.includes(o.id) &&
      !CLOSED_FOR_DRIVER.includes(last?.status) &&
      this.fits(p, o)
    );
  }
  // Mark unanswered offers as missed, and withdraw offers from drivers who
  // went offline. Returns true when anything changed.
  expireOffers() {
    let changed = false;
    for (const o of this.state.orders) {
      if (o.stage !== "searching") continue;
      for (const e of o.dispatch || []) {
        if (e.status !== "offered") continue;
        const p = this.state.profiles.find((x) => x.id === e.driverId);
        if (Date.parse(e.expiresAt) <= Date.now()) {
          this.close(e, "missed", "No response before the request expired");
          e.respondedAt = e.expiresAt;
          this.record(e.driverId, "offer.missed", o.id, {});
          this.missed?.(o, e);
          changed = true;
        } else if (!p?.online || !p.verified) {
          this.close(e, "withdrawn", "Driver went offline");
          changed = true;
        }
      }
    }
    return changed;
  }
  // The single request currently shown to a driver, offering the oldest
  // suitable order when nothing is pending.
  currentOffer(p) {
    if (p.role !== "driver" || !p.online || !p.verified || this.busy(p.id))
      return null;
    for (const o of this.state.orders) {
      const e = this.dispatchEntry(o, p.id);
      if (o.stage === "searching" && e?.status === "offered") return { o, e };
    }
    const o = this.state.orders.find((o) => this.offerable(p, o));
    if (!o) return null;
    const at = Date.now();
    const e = {
      driverId: p.id,
      status: "offered",
      offeredAt: new Date(at).toISOString(),
      expiresAt: new Date(at + this.state.offerSeconds * 1000).toISOString(),
    };
    o.dispatch.push(e);
    this.record(p.id, "offer.sent", o.id, { expiresAt: e.expiresAt });
    return { o, e };
  }
  /**
   * Expire overdue offers and offer waiting orders to every free online
   * driver. Runs on any poll (driver, customer or operations) so dispatch
   * keeps moving and the admin view is current without a driver app open.
   */
  dispatchRound() {
    this.tick();
    const before = this.state.audit.length;
    for (const p of this.state.profiles) this.currentOffer(p);
    if (this.state.audit.length !== before) this.save();
  }
  history(driverId) {
    return this.state.orders
      .flatMap((o) =>
        (o.dispatch || [])
          .filter((e) => e.driverId === driverId)
          .map((e) => ({
            ...e,
            orderId: o.id,
            pickup: o.quote.pickup.name,
            destination: o.quote.destination.name,
            truckId: o.quote.truckId,
            earning: o.financial.earning,
            stage: o.stage,
          })),
      )
      .sort((a, b) => Date.parse(b.offeredAt) - Date.parse(a.offeredAt));
  }
  tick() {
    let changed = this.expireOffers();
    for (const o of this.state.orders) {
      if (
        o.stage === "scheduled" &&
        Date.parse(o.scheduledAt) <= Date.now() &&
        !this.state.orders.some(
          (other) =>
            other.customerId === o.customerId &&
            !["scheduled", "delivered", "cancelled", "returned"].includes(
              other.stage,
            ),
        )
      ) {
        this.update(o, "searching", "Scheduled pickup is now due");
        changed = true;
      }
    }
    if (changed) this.save();
  }
  snapshot(actor) {
    this.tick();
    const p = this.profile(actor);
    const before = this.state.audit.length;
    const current = this.currentOffer(p);
    if (this.state.audit.length !== before) this.save();
    return {
      profile: p,
      people: this.state.profiles.map(
        ({ email, documents, declined, ...x }) => x,
      ),
      trucks,
      places,
      orders: this.state.orders.filter((o) =>
        p.role === "customer" ? o.customerId === actor : o.driverId === actor,
      ),
      offers: current
        ? [
            {
              ...current.o,
              offer: {
                offeredAt: current.e.offeredAt,
                expiresAt: current.e.expiresAt,
              },
            },
          ]
        : [],
      requestHistory: p.role === "driver" ? this.history(actor) : [],
      offerSeconds: this.state.offerSeconds,
      serverTime: now(),
      feeRate: this.state.feeRate,
      helperRate: this.state.helperRate,
    };
  }
  quote(actor, b) {
    fail(
      this.profile(actor).role === "customer",
      "FORBIDDEN",
      "Only a customer can price an order.",
      403,
    );
    const pickup = places.find((p) => p.id === b.pickupId),
      destination = places.find((p) => p.id === b.destinationId),
      truck = trucks.find((t) => t.id === b.truckId);
    fail(
      pickup && destination && pickup.id !== destination.id,
      "ROUTE_INVALID",
      "Choose different pickup and destination locations.",
      422,
    );
    fail(truck, "TRUCK_INVALID", "Choose a supported truck.", 422);
    const loading = b.loading ?? 0,
      offloading = b.offloading ?? 0;
    fail(
      [loading, offloading].every(
        (n) => Number.isInteger(n) && n >= 0 && n <= 2,
      ),
      "HANDLING_INVALID",
      "Choose zero, one or two helpers at each location.",
      422,
    );
    const distance = Math.max(
      2,
      Math.round(
        Math.hypot(
          (pickup.latitude - destination.latitude) * 111,
          (pickup.longitude - destination.longitude) * 111,
        ) * 1.3,
      ),
    );
    const transport = truck.base + distance * truck.perKm;
    const q = {
      id: uid("Q"),
      actor,
      pickup,
      destination,
      truckId: truck.id,
      loading,
      offloading,
      transport,
      loadingFee: loading * this.state.helperRate,
      offloadingFee: offloading * this.state.helperRate,
      distance,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
    q.total = q.transport + q.loadingFee + q.offloadingFee;
    this.state.quotes.push(q);
    this.save();
    return q;
  }
  create(actor, b, key) {
    fail(
      typeof key === "string" && key.length >= 8 && key.length <= 150,
      "KEY_REQUIRED",
      "A unique order reference is required.",
      422,
    );
    const k = actor + ":" + key;
    if (this.state.keys[k]) return this.order(this.state.keys[k], actor);
    const p = this.profile(actor);
    fail(
      p.role === "customer",
      "FORBIDDEN",
      "Only customers can order a truck.",
      403,
    );
    const q = this.state.quotes.find(
      (q) => q.id === b.quoteId && q.actor === actor,
    );
    fail(q, "QUOTE_MISSING", "Get a price before placing your order.", 422);
    fail(
      Date.parse(q.expiresAt) > Date.now(),
      "QUOTE_EXPIRED",
      "This price has expired. Refresh it before ordering.",
    );
    fail(
      METHODS.includes(b.method),
      "METHOD_INVALID",
      "Select a payment method.",
      422,
    );
    fail(
      b.scheduledAt ||
        !this.state.orders.some(
          (o) =>
            o.customerId === actor &&
            !["delivered", "cancelled", "returned", "scheduled"].includes(
              o.stage,
            ),
        ),
      "ACTIVE_ORDER",
      "You already have an active order. Open it to continue.",
    );
    if (b.scheduledAt)
      fail(
        Date.parse(b.scheduledAt) > Date.now() + 60000,
        "SCHEDULE_INVALID",
        "Schedule your pickup at least one minute ahead.",
        422,
      );
    fail(
      !b.recipientPhone || /^\+?[0-9 ()-]{9,18}$/.test(b.recipientPhone),
      "PHONE_INVALID",
      "Check the recipient phone number.",
      422,
    );
    const fee = Math.round(q.total * this.state.feeRate);
    const o = {
      id: uid("LM"),
      customerId: actor,
      driverId: null,
      quote: q,
      stage: b.scheduledAt ? "scheduled" : "searching",
      method: b.method,
      cargo: String(b.cargo || "").slice(0, 1000),
      recipient: String(b.recipient || "").slice(0, 100),
      recipientPhone: String(b.recipientPhone || "").slice(0, 30),
      scheduledAt: b.scheduledAt || null,
      createdAt: now(),
      updatedAt: now(),
      timeline: [],
      payment: { status: "not_due", attempts: [] },
      financial: {
        fee,
        earning: q.total - fee,
        payoutStatus: "not_earned",
        refunded: 0,
        events: [],
      },
      issues: [],
      dispatch: [],
    };
    this.update(o, o.stage, "Order placed");
    this.state.orders.push(o);
    this.state.keys[k] = o.id;
    this.record(actor, "order.created", o.id, { total: q.total });
    return o;
  }
  availability(actor, b) {
    const p = this.profile(actor);
    fail(
      p.role === "driver",
      "FORBIDDEN",
      "Only drivers have availability.",
      403,
    );
    fail(
      p.verified || !b.online,
      "VERIFICATION_REQUIRED",
      "Verify your driver account before going online.",
      403,
    );
    p.online = !!b.online;
    this.expireOffers();
    this.record(actor, "availability.updated", actor, { online: p.online });
    return p;
  }
  accept(actor, id) {
    this.tick();
    const p = this.profile(actor),
      o = this.order(id, "admin");
    if (o.driverId === actor && o.stage === "assigned") return o;
    fail(
      p.role === "driver" && p.verified && p.online,
      "DRIVER_UNAVAILABLE",
      "Go online with a verified vehicle before accepting.",
    );
    fail(
      o.stage === "searching",
      "OFFER_UNAVAILABLE",
      "This request is no longer available.",
    );
    const last = this.dispatchEntry(o, actor);
    fail(
      last?.status !== "missed",
      "OFFER_MISSED",
      "This request timed out and was offered to other drivers.",
    );
    fail(
      !p.declined.includes(id) && !CLOSED_FOR_DRIVER.includes(last?.status),
      "OFFER_DECLINED",
      "You have declined this request.",
    );
    fail(
      !this.busy(actor),
      "DRIVER_BUSY",
      "Finish your current delivery first.",
    );
    fail(
      this.fits(p, o),
      "CAPACITY_MISMATCH",
      "Your vehicle cannot carry this requested load.",
    );
    if (last?.status === "offered") this.close(last, "accepted");
    else {
      const at = now();
      o.dispatch.push({
        driverId: actor,
        status: "accepted",
        offeredAt: at,
        expiresAt: at,
        respondedAt: at,
      });
    }
    o.driverId = actor;
    this.update(o, "assigned", "Driver accepted");
    this.record(actor, "order.accepted", id, {});
    return o;
  }
  decline(actor, id, b = {}) {
    this.tick();
    const p = this.profile(actor);
    fail(
      p.role === "driver",
      "FORBIDDEN",
      "Only drivers can decline requests.",
      403,
    );
    const o = this.order(id, actor);
    const reason = String(b.reason || "")
      .trim()
      .slice(0, 200);
    const last = this.dispatchEntry(o, actor);
    if (last?.status === "offered") this.close(last, "declined", reason);
    else if (!CLOSED_FOR_DRIVER.includes(last?.status)) {
      const at = now();
      o.dispatch.push({
        driverId: actor,
        status: "declined",
        offeredAt: at,
        expiresAt: at,
        respondedAt: at,
        ...(reason ? { reason } : {}),
      });
    }
    if (!p.declined.includes(id)) p.declined.push(id);
    this.record(actor, "order.declined", id, { reason });
    return { ok: true };
  }
  advance(actor, id, b) {
    const o = this.order(id, actor);
    fail(
      o.driverId === actor,
      "FORBIDDEN",
      "Only the assigned driver can update delivery.",
      403,
    );
    const flow = [
      "assigned",
      "to_pickup",
      "at_pickup",
      "loading",
      "in_transit",
      "at_destination",
      "offloading",
      "delivered",
    ];
    if (o.stage === b.stage) return o;
    fail(
      flow.includes(b.stage) &&
        flow.includes(o.stage) &&
        flow[flow.indexOf(o.stage) + 1] === b.stage,
      "STAGE_CONFLICT",
      "The delivery changed. Refresh before continuing.",
    );
    if (b.stage === "delivered")
      fail(
        b.confirmed === true,
        "HANDOVER_REQUIRED",
        "Confirm that the cargo was handed over, or report an issue.",
        422,
      );
    this.update(o, b.stage);
    if (b.stage === "delivered") {
      o.financial.payoutStatus = "scheduled";
      this.attempt(o, "success");
    }
    this.record(actor, "order.progressed", id, { stage: b.stage });
    return o;
  }
  cancel(actor, id, b) {
    const o = this.order(id, actor);
    fail(
      o.customerId === actor || o.driverId === actor,
      "FORBIDDEN",
      "Only the customer or assigned driver can cancel this order.",
      403,
    );
    if (o.stage === "cancelled") return o;
    fail(
      ["scheduled", "searching", "assigned", "to_pickup", "at_pickup"].includes(
        o.stage,
      ),
      "CANCEL_UNAVAILABLE",
      "Cargo is already being handled. Report an issue for support instead.",
    );
    fail(
      String(b.reason || "").trim().length >= 3,
      "REASON_REQUIRED",
      "Tell us why this order is being cancelled.",
      422,
    );
    if (o.driverId === actor && o.customerId !== actor) {
      // A driver backing out releases the order to other drivers instead of
      // ending the customer's order.
      const p = this.profile(actor);
      if (!p.declined.includes(id)) p.declined.push(id);
      const entry = this.dispatchEntry(o, actor);
      if (entry) this.close(entry, "released", b.reason);
      o.driverId = null;
      this.update(o, "searching", "Driver released the order: " + b.reason);
      this.record(actor, "order.released", id, { reason: b.reason });
      return o;
    }
    this.update(o, "cancelled", b.reason);
    this.record(actor, "order.cancelled", id, { reason: b.reason });
    return o;
  }
  attempt(o, scenario) {
    const a = {
      id: uid("PAY"),
      method: o.method,
      status: "awaiting_approval",
      scenario,
      createdAt: now(),
    };
    o.payment.attempts.push(a);
    o.payment.status = a.status;
    o.payment.message = "Approve the simulated payment to finish this demo.";
    return a;
  }
  payment(actor, id, b) {
    const o = this.order(id, actor);
    fail(
      o.customerId === actor,
      "FORBIDDEN",
      "Only the customer can approve a payment.",
      403,
    );
    fail(
      ["delivered", "returned"].includes(o.stage),
      "NOT_DUE",
      "Payment starts after delivery is completed.",
    );
    fail(
      o.payment.status !== "paid",
      "ALREADY_PAID",
      "This order has already been paid.",
    );
    let a = o.payment.attempts.at(-1);
    if (b.action === "retry") {
      fail(
        o.payment.status === "failed",
        "ATTEMPT_PENDING",
        "Check the current payment before starting another attempt.",
      );
      fail(
        METHODS.includes(b.method),
        "METHOD_INVALID",
        "Select a payment method.",
        422,
      );
      o.method = b.method;
      a = this.attempt(o, "success");
    } else if (b.action === "resolve") {
      fail(
        o.payment.status === "unknown" || o.payment.status === "processing",
        "NOT_PENDING",
        "There is no uncertain payment to check.",
      );
      if (a.scenario === "delayed") this.paid(o, a);
      else {
        a.status = "failed";
        a.message = "The operator confirmed no charge. You can safely retry.";
        a.resolvedAt = now();
        o.payment.status = "failed";
        o.payment.message = a.message;
      }
    } else if (b.action === "approve") {
      fail(
        o.payment.status === "awaiting_approval",
        "ATTEMPT_PENDING",
        "This attempt is already processing.",
      );
      fail(
        ["success", "declined", "insufficient", "timeout", "delayed"].includes(
          b.scenario,
        ),
        "SCENARIO_INVALID",
        "Choose a valid demo outcome.",
        422,
      );
      a.scenario = b.scenario;
      if (b.scenario === "success") this.paid(o, a);
      else if (["timeout", "delayed"].includes(b.scenario)) {
        a.status = "unknown";
        a.message =
          "The payment result is not confirmed. Check status before paying again.";
        o.payment.status = "unknown";
        o.payment.message = a.message;
      } else {
        a.status = "failed";
        a.resolvedAt = now();
        a.message =
          b.scenario === "insufficient"
            ? "The demo account has insufficient funds. Try another method."
            : "The demo payment was declined. Try again or choose another method.";
        o.payment.status = "failed";
        o.payment.message = a.message;
      }
    } else
      fail(false, "ACTION_INVALID", "Choose a supported payment action.", 422);
    this.record(actor, "payment." + b.action, id, {
      attempt: a.id,
      status: o.payment.status,
    });
    return o;
  }
  paid(o, a) {
    a.status = "paid";
    a.message = "Payment confirmed.";
    a.resolvedAt = now();
    o.payment.status = "paid";
    o.payment.paidAt = a.resolvedAt;
    o.payment.reference = a.id;
    o.payment.message = "Payment confirmed. Your receipt is ready.";
  }
  issue(actor, id, b) {
    const o = this.order(id, actor);
    fail(
      o.customerId === actor || o.driverId === actor,
      "FORBIDDEN",
      "Only participants can report an order issue.",
      403,
    );
    const message = String(b.message || "").trim();
    fail(
      message.length >= 5,
      "MESSAGE_REQUIRED",
      "Describe the issue in at least five characters.",
      422,
    );
    o.issues.push({
      id: uid("CASE"),
      message: message.slice(0, 1500),
      createdAt: now(),
      status: "open",
    });
    this.record(actor, "issue.created", id, {});
    return o;
  }
  edit(actor, b) {
    const p = this.profile(actor);
    fail(
      typeof b.name === "string" && b.name.trim().length >= 2,
      "NAME_INVALID",
      "Enter your name.",
      422,
    );
    p.name = b.name.trim().slice(0, 80);
    this.record(actor, "profile.updated", actor, {});
    return p;
  }
  admin(id, b) {
    const o = this.order(id, "admin");
    const amount = b.amount;
    fail(
      Number.isSafeInteger(amount) && amount > 0,
      "AMOUNT_INVALID",
      "Enter a positive whole UGX amount.",
      422,
    );
    fail(
      String(b.reason || "").trim().length >= 5,
      "REASON_REQUIRED",
      "A clear reason is required.",
      422,
    );
    fail(
      typeof b.key === "string" && b.key.length >= 8,
      "KEY_REQUIRED",
      "A unique operation reference is required.",
      422,
    );
    if (o.financial.events.some((e) => e.id === b.key)) return o;
    let source, destination;
    if (b.action === "refund") {
      fail(
        o.payment.status === "paid",
        "NOT_REFUNDABLE",
        "Only confirmed collections can be refunded.",
      );
      fail(
        amount <= o.quote.total - o.financial.refunded,
        "REFUND_LIMIT",
        "This exceeds the remaining refundable amount.",
      );
      o.financial.refunded += amount;
      source = "original_collection";
      destination =
        this.refundDestination?.(o) || o.customerId + ":" + o.method;
    } else if (b.action === "payout" || b.action === "guarantee") {
      fail(
        ["delivered", "returned"].includes(o.stage) &&
          o.financial.payoutStatus === "scheduled",
        "PAYOUT_UNAVAILABLE",
        "No unpaid driver entitlement exists.",
      );
      fail(
        amount === o.financial.earning,
        "AMOUNT_MISMATCH",
        "Pay the recorded driver entitlement.",
      );
      fail(
        b.action === "guarantee"
          ? o.payment.status !== "paid"
          : o.payment.status === "paid",
        "PAYOUT_SOURCE",
        "Use platform funding for an unpaid customer delivery.",
      );
      fail(
        this.state.funding >= amount,
        "INSUFFICIENT_FUNDS",
        "The demo platform funding account has insufficient funds.",
      );
      this.state.funding -= amount;
      o.financial.payoutStatus = "paid";
      source =
        b.action === "guarantee" ? "platform_reserve" : "collection_settlement";
      destination = o.driverId;
    } else
      fail(false, "ACTION_INVALID", "Choose refund, payout or guarantee.", 422);
    o.financial.events.push({
      id: b.key,
      kind: b.action,
      amount,
      reason: b.reason,
      status: "completed",
      createdAt: now(),
      source,
      destination,
    });
    this.record("admin", b.action, id, {
      amount,
      reason: b.reason,
      source,
      destination,
    });
    return o;
  }
}
